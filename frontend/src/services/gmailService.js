const CLIENT_ID =
    "655406559089-emh5q2924crll43t10infusudkb4ub37.apps.googleusercontent.com";

const GMAIL_SCOPE =
    "https://www.googleapis.com/auth/gmail.compose";

let tokenClient = null;

function getGoogle() {
    if (!window.google?.accounts?.oauth2) {
        throw new Error(
            "Google Identity Services belum siap."
        );
    }

    return window.google;
}

function getTokenClient() {
    if (tokenClient) {
        return tokenClient;
    }

    const google = getGoogle();

    tokenClient =
        google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: GMAIL_SCOPE,
            callback: () => { },
        });

    return tokenClient;
}

export function requestGmailAccess() {
    return new Promise((resolve, reject) => {
        try {
            const client = getTokenClient();

            client.callback = (response) => {
                if (response.error) {
                    reject(
                        new Error(
                            response.error_description ||
                            response.error
                        )
                    );

                    return;
                }

                resolve(response.access_token);
            };

            client.requestAccessToken({
                prompt: "",
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Mengubah File/Blob menjadi Base64.
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const dataUrl = reader.result;

            if (
                typeof dataUrl !== "string"
            ) {
                reject(
                    new Error(
                        "Gagal membaca file CV."
                    )
                );

                return;
            }

            const base64 =
                dataUrl.split(",")[1] || "";

            resolve(base64);
        };

        reader.onerror = () => {
            reject(
                new Error(
                    "Gagal membaca file CV."
                )
            );
        };

        reader.readAsDataURL(file);
    });
}

function base64UrlEncode(value) {
    const bytes =
        new TextEncoder().encode(value);

    let binary = "";

    const chunkSize = 0x8000;

    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {
        binary += String.fromCharCode(
            ...bytes.subarray(
                i,
                i + chunkSize
            )
        );
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

async function buildMimeMessage({
    to,
    subject,
    body,
    file,
}) {
    const boundary =
        `----JobApplicationAssistant_${Date.now()}`;

    const pdfBase64 =
        await fileToBase64(file);

    const filename =
        file.name || "CV.pdf";

    const mimeType =
        file.type ||
        "application/pdf";

    const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        "Content-Transfer-Encoding: 8bit",
        "",
        body,
        "",
        `--${boundary}`,
        `Content-Type: ${mimeType}; name="${filename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${filename}"`,
        "",
        pdfBase64,
        "",
        `--${boundary}--`,
    ].join("\r\n");

    return base64UrlEncode(message);
}

export async function createGmailDraft({
    to,
    subject,
    body,
    file,
}) {
    if (!to) {
        throw new Error(
            "Email tujuan belum tersedia."
        );
    }

    if (!(file instanceof Blob)) {
        throw new Error(
            "File CV tidak valid."
        );
    }

    const accessToken =
        await requestGmailAccess();

    const raw =
        await buildMimeMessage({
            to,
            subject,
            body,
            file,
        });

    const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
        {
            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${accessToken}`,

                "Content-Type":
                    "application/json",
            },

            body: JSON.stringify({
                message: {
                    raw,
                },
            }),
        }
    );

    if (!response.ok) {
        const error =
            await response.text();

        console.error(
            "Gmail API error:",
            error
        );

        throw new Error(
            "Gagal membuat draft Gmail."
        );
    }

    return response.json();
}
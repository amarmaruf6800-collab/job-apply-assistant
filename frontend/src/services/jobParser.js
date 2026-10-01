const EMAIL_REGEX =
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function cleanLine(line) {
    const isSubjectLine =
        /\b(?:subject|subjek)(?:\s+email|\s+lamaran)?\s*[:-]/i.test(
            line
        );

    return line
        .replace(/^[^\p{L}\p{N}]+/u, "")
        .replace(
            isSubjectLine
                ? /[•●▪■►]/g
                : /[|•●▪■►]/g,
            " "
        )
        .replace(/\s+/g, " ")
        .trim();
}

function getLines(text) {
    return text
        .split("\n")
        .map(cleanLine)
        .filter((line) => line.length > 1);
}

/* --------------------------------
   USER PROFILE
-------------------------------- */

function getUserName() {
    return (
        localStorage.getItem("userName")?.trim() ||
        "Amar"
    );
}

/* --------------------------------
   EMAIL
-------------------------------- */

function findEmail(text) {
    if (!text) return "";

    const normalizedText = text
        .replace(
            /\[\s*at\s*\]|\(\s*at\s*\)|\s+at\s+/gi,
            "@"
        )
        .replace(
            /\[\s*dot\s*\]|\(\s*dot\s*\)|\s+dot\s+/gi,
            "."
        );

    const lines = normalizedText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    const emailContextLines = lines.filter((line) =>
        /\b(?:email|e-mail|emailnya|mail)\b/i.test(line)
    );

    const validTlds = [
        "com",
        "id",
        "co.id",
        "ac.id",
        "go.id",
        "or.id",
        "sch.id",
        "net",
        "org",
        "biz",
        "info",
        "me",
        "io",
        "dev",
        "co",
        "my.id",
    ];

    const emailRegex =
        /[A-Z0-9._%+-]+\s*@\s*[A-Z0-9.-]+\s*\.\s*[A-Z]{2,}(?:\s*\.\s*[A-Z]{2,})?/gi;

    function isValidEmail(email) {
        if (!email) return false;

        const cleaned = email
            .replace(/\s+/g, "")
            .trim()
            .toLowerCase();

        const parts = cleaned.split("@");

        if (parts.length !== 2) {
            return false;
        }

        const username = parts[0];
        const domain = parts[1];

        if (
            !username ||
            username.length < 2 ||
            !domain
        ) {
            return false;
        }

        if (
            /^\d+(?:st|nd|rd|th)$/i.test(
                username
            )
        ) {
            return false;
        }

        const tld = validTlds.find(
            (candidate) =>
                domain === candidate ||
                domain.endsWith(
                    "." + candidate
                )
        );

        if (!tld) {
            return false;
        }

        if (
            domain.includes("pend.min") ||
            domain.includes("maks") ||
            domain.includes("min")
        ) {
            return false;
        }

        return cleaned;
    }

    for (const line of emailContextLines) {
        const matches =
            line.match(emailRegex) || [];

        for (const match of matches) {
            const email =
                isValidEmail(match);

            if (email) {
                return email;
            }
        }
    }

    const matches =
        normalizedText.match(emailRegex) || [];

    for (const match of matches) {
        const email =
            isValidEmail(match);

        if (email) {
            return email;
        }
    }

    const partialEmailRegex =
        /\b([a-z0-9._%+-]+)\s*@\s*(gmail|yahoo|outlook|hotmail|icloud|protonmail)\b/gi;

    const partialMatches =
        normalizedText.match(
            partialEmailRegex
        ) || [];

    for (const partial of partialMatches) {
        const match =
            partial.match(
                /\b([a-z0-9._%+-]+)\s*@\s*(gmail|yahoo|outlook|hotmail|icloud|protonmail)\b/i
            );

        if (!match) continue;

        const username = match[1].trim();
        const provider =
            match[2].toLowerCase();

        const reconstructed =
            `${username}@${provider}.com`;

        const valid =
            isValidEmail(reconstructed);

        if (valid) {
            return valid;
        }
    }

    return "";
}

/* --------------------------------
   COMPANY
-------------------------------- */

function findCompany(lines, email, text) {
    /*
     * Email perusahaan menjadi petunjuk nama brand.
     */
    if (email) {
        const domain = email
            .split("@")[1]
            ?.toLowerCase();

        if (domain) {
            const companyPart = domain.split(".")[0];

            if (
                companyPart &&
                ![
                    "gmail",
                    "yahoo",
                    "outlook",
                    "hotmail",
                    "icloud",
                    "protonmail",
                ].includes(companyPart)
            ) {
                return companyPart;
            }
        }
    }

    /*
     * Cari nama perusahaan dengan format:
     * PT Nama Perusahaan Tbk / Persero atau CV Nama Perusahaan.
     */
    for (const line of lines) {
        const match = line.match(
            /\b((?:PT|CV)\.?\s+.+?\b(?:Tbk|Persero(?:\s+Tbk)?))\b/i
        );

        if (match) {
            return cleanLine(match[1]);
        }
    }

    for (const line of lines) {
        if (/^(pt|cv)\.?\s+/i.test(line)) {
            return line;
        }
    }

    /*
     * Cari domain website perusahaan tanpa mengambil
     * domain media sosial atau layanan pemendek URL.
     */
    const domainMatches = text.match(
        /\b(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+)\.(?:co\.id|com|id|net|org)\b/gi
    );

    const ignoredDomains = [
        "instagram",
        "facebook",
        "twitter",
        "x",
        "linkedin",
        "youtube",
        "tiktok",
        "bitly",
        "bit.ly",
        "t",
        "s",
        "tinyurl",
        "forms",
        "goo",
        "gmail",
        "google",
        "yahoo",
    ];
    const knownBrands = {
        morarepublic: "MoraRepublic",
    };

    for (const rawDomain of domainMatches || []) {
        const domain = rawDomain
            .replace(/^https?:\/\//i, "")
            .replace(/^www\./i, "")
            .split("/")[0]
            .toLowerCase();
        const name = domain.split(".")[0];

        if (name && !ignoredDomains.includes(name)) {
            const normalizedName = name.replace(
                /[^a-z0-9]/g,
                ""
            );

            return knownBrands[normalizedName] || name;
        }
    }

    if (/\bmora\s*republic\s*\.\s*co\s*\.\s*id\b/i.test(text)) {
        return "MoraRepublic";
    }

    return "";
}

/* --------------------------------
   POSITION
-------------------------------- */

function findExplicitPosition(lines) {
    const pattern =
        /^(?:posisi|position|jabatan|vacancy|lowongan|role)\s*[:-]\s*(.+)$/i;

    for (const line of lines) {
        const match = line.match(pattern);

        if (
            match?.[1] &&
            match[1].trim().length >= 3 &&
            match[1].trim().length <= 120
        ) {
            return match[1].trim();
        }
    }

    return "";
}

function normalizePosition(position) {
    if (!position) {
        return "";
    }

    const result = position
        .trim()
        .replace(/\bSal(?:[-–—])?(?=\W|$)/gi, "Sales")
        .replace(/\bSaI(?:[-–—])?(?=\W|$)/gi, "Sales");

    if (/^Account Executive\b/i.test(result)) {
        return "Account Executive (Sales MyRepublic)";
    }

    return result;
}

function findPositionFromHiringLine(lines) {
    const positionPattern =
        /\b(account executive|business development(?:\s+specialist)?|sales executive|production operator|customer service|software engineer|software developer|web developer|frontend developer|backend developer|full[\s-]?stack developer|graphic designer|ui\/?ux designer|warehouse staff|staff gudang|operator(?:\s+gudang)?|programmer|marketing|admin)\b(?:\s*(\([^)]{1,80}\)))?/i;

    for (const line of lines) {
        if (line.length > 120) {
            continue;
        }

        const match = positionPattern.exec(line);

        if (match?.[2]) {
            return `${match[1]} ${match[2]}`.trim();
        }
    }

    for (let i = 0; i < lines.length - 1; i++) {
        if (
            /\b(account executive|business development|sales executive|production operator|customer service|software engineer|software developer|web developer|frontend developer|backend developer|full[\s-]?stack developer|operator)\b/i.test(
                lines[i]
            ) &&
            /^\([^)]{1,80}\)$/.test(lines[i + 1])
        ) {
            return `${lines[i].trim()} ${lines[i + 1].trim()}`;
        }
    }

    for (const line of lines) {
        if (
            line.length > 120 ||
            /^(?:we are hiring|hiring|lowongan kerja)$/i.test(line)
        ) {
            continue;
        }

        const match = positionPattern.exec(line);

        if (match) {
            return `${match[1]}${match[2] || ""}`.trim();
        }
    }

    return "";
}

function findPosition(lines) {
    const explicitPosition =
        findExplicitPosition(lines);

    if (explicitPosition) {
        return normalizePosition(explicitPosition);
    }

    const hiringPosition =
        findPositionFromHiringLine(lines);

    if (hiringPosition) {
        return normalizePosition(hiringPosition);
    }

    for (const line of lines) {
        const match = line.match(
            /\bsebagai\s+([A-Za-z][A-Za-z0-9 /&().-]{2,60}?)(?:\.|,|$)/i
        );

        if (match) {
            return match[1].trim();
        }
    }

    const positions = [
        "Daily Worker Gudang",
        "Warehouse Staff",
        "Warehouse",
        "Production Operator",
        "Staff Gudang",
        "Operator Gudang",
        "Admin Gudang",
        "Picker",
        "Packer",
        "Logistic Staff",
        "Staff Logistik",

        "Backend Developer",
        "Backend",
        "Frontend Developer",
        "Frontend",
        "Full Stack Developer",
        "Fullstack Developer",
        "Full Stack",
        "Software Developer",
        "Software Engineer",
        "Web Developer",
        "Mobile Developer",
        "UI/UX Designer",
        "UI UX Designer",
        "Graphic Designer",
        "Content Creator",
        "Social Media Specialist",

        "IT Support",
        "Teknisi Komputer",
        "Network Engineer",
        "Programmer",

        "Digital Marketing",
        "Account Executive",
        "Marketing",
        "Sales Executive",
        "Sales",
        "Customer Service",

        "Accounting",
        "Finance",
        "Administrator",
        "Admin",
        "HRD",
        "Human Resources",
    ];

    const sortedPositions = [...positions].sort(
        (a, b) => b.length - a.length
    );

    for (const position of sortedPositions) {
        const regex = new RegExp(
            `\\b${position.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            )}\\b`,
            "i"
        );

        const found = lines.find((line) =>
            regex.test(line)
        );

        if (found) {
            return position;
        }
    }

    return "";
}

/* --------------------------------
   SUBJECT
-------------------------------- */

function replaceNamePlaceholder(subject) {
    const userName = getUserName();

    let result = subject;

    const namePlaceholder =
        /[\[\{<]\s*(?:nama|name|nama[\s_-]+kamu|nama[\s_-]+anda|nama[\s_-]+lengkap|name[\s_-]+kamu|your[\s_-]+name|full[\s_-]+name)\s*[\]\}>]/gi;

    result = result.replace(
        namePlaceholder,
        userName
    );

    result = result.replace(
        /[\[\{<]\s*nama[\s_-]+(?:kamu|anda|lengkap)\s*[\]\}>]/gi,
        userName
    );

    result = result.replace(
        /[\[\{<]\s*(?:nama|name)\s*[\]\}>]/gi,
        userName
    );

    return result;
}

function replacePositionPlaceholder(
    subject,
    position
) {
    if (!position) {
        return subject;
    }

    let result = subject;

    result = result.replace(
        /\[\s*(posisi|position|job position|jabatan)\s*\]/gi,
        position
    );

    result = result.replace(
        /\{\s*(posisi|position|job position|jabatan)\s*\}/gi,
        position
    );

    result = result.replace(
        /<\s*(posisi|position|job position|jabatan)\s*>/gi,
        position
    );

    return result;
}

function formatSubject(subject, position) {
    let result = subject.trim();

    // Ganti placeholder nama terlebih dahulu
    result = replaceNamePlaceholder(result);

    // Ganti placeholder posisi
    result = replacePositionPlaceholder(
        result,
        position
    );

    const userName = getUserName();

    result = result.replace(
        /(?:^|[\s\-|/_])(?:nama[\s_-]*(?:kamu|anda|lengkap)?|name|your[\s_-]*name|full[\s_-]*name)$/i,
        (match) => {
            const prefix = match.replace(
                /(?:nama[\s_-]*(?:kamu|anda|lengkap)?|name|your[\s_-]*name|full[\s_-]*name)$/i,
                ""
            );

            return `${prefix}${userName}`;
        }
    );

    result = result
        .replace(/\s+/g, " ")
        .replace(/\s+([,.:;])/g, "$1")
        .trim();

    result = result
        .replace(/\s*-\s*/g, (match) => {
            if (match.includes(" ")) {
                return " - ";
            }

            return "-";
        })
        .trim();

    return result;
}

function findSubject(lines, position) {
    function removeDeadline(value) {
        return value
            .replace(
                /\b(?:0?[1-9]|[12]\d|3[01])\s+(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}\b/gi,
                ""
            )
            .replace(
                /\b(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}\b/gi,
                ""
            )
            .replace(/\s+/g, " ")
            .trim()
            .replace(/[.,:;]+$/, "")
            .trim();
    }

    function normalizeSubjectValue(value) {
        if (!value) return "";

        let result = removeDeadline(value);

        /*
         * OCR bisa menghilangkan underscore.
         *
         * Contoh:
         * Lamaran Administrasi Nama
         *
         * menjadi:
         * Lamaran_Administrasi_Nama
         */
        result = result
            .replace(
                /\bLamaran\s+Administr(?:asi)?\s+Nama\b/i,
                "Lamaran_Administrasi_Nama"
            )
            .replace(
                /\bLamaran\s+Administrasi\s+Nama\b/i,
                "Lamaran_Administrasi_Nama"
            );

        return result.trim();
    }

    /*
     * =====================================================
     * 1. CARI SUBJECT DI DALAM BARIS
     *
     * Tidak menggunakan ^ supaya noise OCR di depan
     * tidak membuat subject gagal terdeteksi.
     *
     * Contoh:
     *
     * "Subjek Email: Gudang Batu Ceper"
     *
     * maupun:
     *
     * "= 2 Subjek Email: Gudang Batu Ceper"
     *
     * keduanya akan terbaca.
     * =====================================================
     */

    const subjectPatterns = [
        /\bsubject\s+email\s*[:-]\s*(.+)$/i,
        /\bsubjek\s+email\s*[:-]\s*(.+)$/i,

        /\bsubject\s+lamaran\s*[:-]\s*(.+)$/i,
        /\bsubjek\s+lamaran\s*[:-]\s*(.+)$/i,

        /\bsubject\s*[:-]\s*(.+)$/i,
        /\bsubjek\s*[:-]\s*(.+)$/i,

        /kirim\s+dengan\s+subject\s*[:-]?\s*(.+)$/i,
        /kirim\s+dengan\s+subjek\s*[:-]?\s*(.+)$/i,

        /format\s+subject\s*[:-]?\s*(.+)$/i,
        /format\s+subjek\s*[:-]?\s*(.+)$/i,

        /email\s+dengan\s+subject\s*[:-]?\s*(.+)$/i,
        /email\s+dengan\s+subjek\s*[:-]?\s*(.+)$/i,
    ];

    for (const line of lines) {
        for (const pattern of subjectPatterns) {
            const match = line.match(pattern);

            if (!match) continue;

            const value =
                normalizeSubjectValue(match[1]);

            if (!value) continue;

            return formatSubject(
                value,
                position
            );
        }
    }

    /*
     * =====================================================
     * 2. SUBJECT DI BARIS BERIKUTNYA
     * =====================================================
     */

    for (let i = 0; i < lines.length - 1; i++) {
        const currentLine = lines[i];

        if (
            /\b(?:subject|subjek)(?:\s+email|\s+lamaran)?\b/i.test(
                currentLine
            )
        ) {
            /*
             * Kalau baris sekarang belum memiliki ":" atau
             * isi subject, coba ambil baris berikutnya.
             */

            const nextLine = lines[i + 1];

            if (
                nextLine &&
                nextLine.length <= 120
            ) {
                const value =
                    normalizeSubjectValue(
                        nextLine
                    );

                if (value) {
                    return formatSubject(
                        value,
                        position
                    );
                }
            }
        }
    }

    /*
     * =====================================================
     * 3. FALLBACK
     *
     * Jangan membuat subject berdasarkan posisi.
     * =====================================================
     */

    const userName = getUserName();

    return `Lamaran pekerjaan - ${userName}`;
}

/* --------------------------------
   LOCATION
-------------------------------- */

function findLocation(lines) {
    const locationPatterns = [
        /^penempatan\s*[:-]\s*(.+)$/i,
        /^lokasi\s*[:-]\s*(.+)$/i,
        /^location\s*[:-]\s*(.+)$/i,
        /^placement\s*[:-]\s*(.+)$/i,
        /^ditempatkan\s*[:-]\s*(.+)$/i,
    ];

    for (const line of lines) {
        for (const pattern of locationPatterns) {
            const match = line.match(pattern);

            if (match) {
                const value = match[1].trim();

                if (
                    value &&
                    !/^(bahasa|language)$/i.test(value)
                ) {
                    return value;
                }
            }
        }
    }

    for (const line of lines) {
        const regency = line.match(
            /\b(kabupaten\s+[a-z]+(?:\s+[a-z]+)?)\b/i
        );

        if (regency) {
            return regency[1]
                .replace(/\b\w/g, (letter) =>
                    letter.toUpperCase()
                );
        }
    }

    const cities = [
        "Jakarta Barat",
        "Jakarta Selatan",
        "Jakarta Timur",
        "Jakarta Utara",
        "Jakarta Pusat",
        "Jakarta",
        "Tangerang Selatan",
        "Tangerang",
        "Bekasi",
        "Depok",
        "Bogor",
        "Bandung",
        "Surabaya",
        "Semarang",
        "Yogyakarta",
        "Medan",
        "Makassar",
    ];

    for (const city of cities) {
        const regex = new RegExp(
            `\\b${city.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            )}\\b`,
            "i"
        );

        const found = lines.find((line) =>
            regex.test(line)
        );

        if (found) {
            return city;
        }
    }

    return "";
}

/* --------------------------------
   APPLICATION METHOD
-------------------------------- */

/*
 * Nomor telepon Indonesia.
 *
 * Contoh:
 * 081234567890
 * 0812-3456-7890
 * +62 812 3456 7890
 * 6281234567890
 */

const PHONE_REGEX =
    /(?:\+?62[\s.-]?|0)8(?:[\s.-]?\d){8,12}/g;

/*
 * URL sederhana.
 */

const URL_REGEX =
    /(?:https?:\/\/|www\.)[^\s<>"'`]+|(?:bit\.ly|t\.ly|s\.id|tinyurl\.com|forms\.gle)\/[^\s<>"'`]+/gi;

/* --------------------------------
   NORMALIZE PHONE
-------------------------------- */

function normalizePhone(value) {
    if (!value) return "";

    let phone = value.replace(/[^\d+]/g, "");

    if (phone.startsWith("+62")) {
        phone = "0" + phone.slice(3);
    } else if (phone.startsWith("62")) {
        phone = "0" + phone.slice(2);
    }

    return phone;
}

/* --------------------------------
   CLEAN URL
-------------------------------- */

function cleanUrl(value) {
    if (!value) return "";

    return value
        .trim()
        .replace(/[),.;:]+$/g, "");
}

/* --------------------------------
   FIND WHATSAPP
-------------------------------- */

function findWhatsapp(text) {
    const lines = getLines(text);

    /*
     * Prioritaskan nomor yang berada
     * dekat kata WhatsApp / WA.
     */

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (
            /\b(whatsapp|whats\s*app|wa)\b/i.test(
                line
            )
        ) {
            const nearbyText = [
                lines[i - 1] || "",
                line,
                lines[i + 1] || "",
            ].join(" ");

            const matches =
                nearbyText.match(PHONE_REGEX);

            if (matches?.[0]) {
                return normalizePhone(
                    matches[0]
                );
            }
        }
    }

    /*
     * Fallback untuk poster yang hanya menampilkan ikon
     * WhatsApp tanpa teks WA di hasil OCR.
     */
    const phoneMatches = text.match(PHONE_REGEX);

    if (phoneMatches?.length) {
        return normalizePhone(phoneMatches[0]);
    }

    return "";
}

/* --------------------------------
   FIND APPLICATION URL
-------------------------------- */

function findApplicationUrl(text) {
    const matches = [...text.matchAll(URL_REGEX)];

    if (!matches?.length) {
        return "";
    }

    const cleanedMatches = matches
        .map((match) => ({
            url: cleanUrl(match[0]),
            index: match.index,
        }))
        .filter((match) => match.url);

    if (!cleanedMatches.length) {
        return "";
    }

    const preferred = cleanedMatches.find(({ url, index }) => {
        const context = text.slice(
            Math.max(0, index - 100),
            index
        );

        return (
            /\b(?:apply\s*to|application|daftar|lamar|lowongan)\b/i.test(
                context
            ) ||
            /(apply|career|careers|job|jobs|recruit|recruitment|register|registration|daftar|lamar|lowongan)/i.test(
                url
            )
        );
    });

    return cleanUrl(
        (preferred || cleanedMatches[0]).url
    );
}

/* --------------------------------
   QR DETECTION
-------------------------------- */

function hasQrInstruction(text) {
    return /\b(?:scan|scanning|pindai|scan\s+qr|qr\s+code|kode\s+qr|barcode)\b/i.test(
        text
    );
}

/* --------------------------------
   DIRECT APPLICATION
-------------------------------- */

function hasDirectApplicationInstruction(text) {
    return /\b(?:datang\s+langsung|walk[\s-]?in|bawa\s+cv|kirim\s+langsung|serahkan\s+cv|antar\s+cv|daftar\s+langsung|datang\s+ke\s+kantor|lamaran\s+langsung)\b/i.test(
        text
    );
}

/* --------------------------------
   FIND APPLICATION METHOD
-------------------------------- */

function findApplicationMethod(
    text,
    email,
    whatsapp,
    applicationUrl,
    qrData = ""
) {
    /*
     * EMAIL adalah metode utama aplikasi.
     *
     * Jika email tersedia, email menjadi
     * metode utama meskipun poster juga
     * menyediakan WhatsApp / website.
     */

    if (email) {
        return "email";
    }

    if (applicationUrl) {
        return "website";
    }

    if (whatsapp) {
        return "whatsapp";
    }

    /*
     * Poster meminta scan QR.
     */

    if (qrData || hasQrInstruction(text)) {
        return "qr";
    }

    /*
     * Pelamar diarahkan datang langsung
     * ke kantor.
     *
     * Backend saat ini belum memiliki
     * method "office", sehingga sementara
     * menggunakan "unknown".
     */

    if (hasDirectApplicationInstruction(text)) {
        return "unknown";
    }

    return "unknown";
}

/* --------------------------------
   MAIN PARSER
-------------------------------- */

export function parseJobText(
    text,
    qrData = ""
) {
    const lines = getLines(text);
    const cleanQrData = qrData?.trim() || "";
    const qrUrl = /^https?:\/\//i.test(cleanQrData)
        ? cleanQrData
        : "";

    /*
     * EMAIL
     */

    const email = findEmail(text);

    /*
     * COMPANY
     */

    const company = findCompany(
        lines,
        email,
        text
    );

    /*
     * POSITION
     */

    const position = findPosition(lines);

    /*
     * SUBJECT
     */

    const subject = findSubject(
        lines,
        position
    );

    /*
     * LOCATION
     */

    const location = findLocation(lines);

    /*
     * WHATSAPP
     */

    const whatsapp = findWhatsapp(text);

    /*
     * WEBSITE / LINK
     */

    const applicationUrl =
        findApplicationUrl(text);

    /*
     * APPLICATION METHOD
     */

    const applicationMethod =
        findApplicationMethod(
            text,
            email,
            whatsapp,
            applicationUrl,
            cleanQrData
        );

    /*
     * HASIL AKHIR
     */

    return {
        company,
        position,
        email,
        subject,
        location,

        applicationMethod,
        whatsapp,
        applicationUrl,
        qrData: cleanQrData,
        qrUrl,

        rawText: text,
        lines,
    };
}
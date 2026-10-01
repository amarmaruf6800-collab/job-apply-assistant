import Tesseract from "tesseract.js";
import jsQR from "jsqr";

/* =========================================================
   QR CODE
========================================================= */

export function decodeQRCode(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        const cleanup = () => {
            URL.revokeObjectURL(url);
            img.onload = null;
            img.onerror = null;
        };

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d", {
                    willReadFrequently: true,
                });

                if (!ctx) {
                    throw new Error(
                        "Gagal menyiapkan canvas untuk membaca QR Code."
                    );
                }

                const originalWidth =
                    img.naturalWidth || img.width;

                const originalHeight =
                    img.naturalHeight || img.height;

                const maxSize = 3000;

                const scale = Math.max(
                    1,
                    Math.min(
                        3,
                        maxSize /
                        Math.max(
                            originalWidth,
                            originalHeight
                        )
                    )
                );

                canvas.width =
                    Math.round(originalWidth * scale);

                canvas.height =
                    Math.round(originalHeight * scale);

                ctx.drawImage(
                    img,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                const code = jsQR(
                    imageData.data,
                    imageData.width,
                    imageData.height,
                    {
                        inversionAttempts: "attemptBoth",
                    }
                );

                cleanup();

                resolve(code?.data.trim() || "");
            } catch (error) {
                cleanup();
                reject(error);
            }
        };

        img.onerror = () => {
            cleanup();

            reject(
                new Error(
                    "Gagal membaca gambar untuk QR Code."
                )
            );
        };

        img.src = url;
    });
}


/* =========================================================
   OCR
========================================================= */

async function scanEmailRegion(canvas) {
    try {
        const labelResult = await Tesseract.recognize(
            canvas,
            "ind+eng",
            {
                config: {
                    tessedit_pageseg_mode: "11",
                },
            }
        );

        const words = labelResult.data.words || [];

        const emailLabel = words.find((word) =>
            /^(e[-\s]?mail|email|alamat)$/i.test(
                word.text?.trim()
            )
        );

        if (!emailLabel?.bbox) {
            return "";
        }

        const { x0, y0 } = emailLabel.bbox;

        const cropX = Math.max(
            0,
            x0 - 80
        );

        const cropY = Math.max(
            0,
            y0 - 35
        );

        const cropWidth = Math.min(
            canvas.width - cropX,
            Math.max(
                700,
                canvas.width - cropX
            )
        );

        const cropHeight = Math.min(
            140,
            canvas.height - cropY
        );

        const emailCanvas =
            document.createElement("canvas");

        emailCanvas.width = cropWidth;
        emailCanvas.height = cropHeight;

        const emailCtx =
            emailCanvas.getContext("2d");

        if (!emailCtx) {
            return "";
        }

        emailCtx.drawImage(
            canvas,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
        );

        const result =
            await Tesseract.recognize(
                emailCanvas,
                "ind+eng",
                {
                    config: {
                        tessedit_pageseg_mode: "6",
                    },
                }
            );

        console.log(
            "========== EMAIL REGION OCR =========="
        );
        console.log(result.data.text);

        return result.data.text || "";
    } catch (error) {
        console.warn(
            "Email region OCR gagal:",
            error
        );

        return "";
    }
}

export async function scanImage(file, onProgress) {
    const originalUrl = URL.createObjectURL(file);

    try {
        const image = new Image();

        await new Promise((resolve, reject) => {
            image.onload = resolve;

            image.onerror = () =>
                reject(
                    new Error("Gagal membaca file gambar.")
                );

            image.src = originalUrl;
        });

        const width =
            image.naturalWidth || image.width;

        const height =
            image.naturalHeight || image.height;


        /* =====================================================
           CANVAS ORIGINAL
        ===================================================== */

        const originalCanvas =
            document.createElement("canvas");

        const originalCtx =
            originalCanvas.getContext("2d");

        if (!originalCtx) {
            throw new Error(
                "Gagal menyiapkan canvas untuk OCR."
            );
        }

        const originalScale = Math.min(
            2.5,
            Math.max(
                1,
                2400 / Math.max(width, height)
            )
        );

        originalCanvas.width =
            Math.round(width * originalScale);

        originalCanvas.height =
            Math.round(height * originalScale);

        originalCtx.drawImage(
            image,
            0,
            0,
            originalCanvas.width,
            originalCanvas.height
        );


        /* =====================================================
           CANVAS PROCESSED
        ===================================================== */

        const processedCanvas =
            document.createElement("canvas");

        const processedCtx =
            processedCanvas.getContext("2d");

        if (!processedCtx) {
            throw new Error(
                "Gagal menyiapkan canvas gambar untuk OCR."
            );
        }

        processedCanvas.width =
            originalCanvas.width;

        processedCanvas.height =
            originalCanvas.height;

        processedCtx.drawImage(
            image,
            0,
            0,
            processedCanvas.width,
            processedCanvas.height
        );

        const imageData =
            processedCtx.getImageData(
                0,
                0,
                processedCanvas.width,
                processedCanvas.height
            );

        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const gray =
                0.299 * data[i] +
                0.587 * data[i + 1] +
                0.114 * data[i + 2];

            const adjusted =
                ((gray - 128) * 1.35) + 128;

            const value = Math.max(
                0,
                Math.min(255, adjusted)
            );

            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }

        processedCtx.putImageData(
            imageData,
            0,
            0
        );


        /* =====================================================
           OCR PASSES

           1. Original - sparse text
           2. Processed - sparse text
           3. Original - email-focused
        ===================================================== */

        const ocrPasses = [
            {
                canvas: originalCanvas,
                mode: "11",
                config: {},
            },

            {
                canvas: processedCanvas,
                mode: "11",
                config: {},
            },

            {
                canvas: originalCanvas,
                mode: "11",
                config: {
                    /*
                     * Fokus karakter yang umum digunakan
                     * pada email.
                     *
                     * Ini membantu kasus seperti:
                     * hrdannisadua@gmail.com
                     */
                    tessedit_char_whitelist:
                        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@._%+-",
                },
            },
        ];

        const results = [];

        for (
            let i = 0;
            i < ocrPasses.length;
            i++
        ) {
            const pass = ocrPasses[i];

            const result =
                await Tesseract.recognize(
                    pass.canvas,
                    "ind+eng",
                    {
                        logger: (message) => {
                            if (
                                message.status ===
                                "recognizing text"
                            ) {
                                const localProgress =
                                    Math.round(
                                        message.progress *
                                        100
                                    );

                                const progress =
                                    Math.round(
                                        (
                                            i * 100 +
                                            localProgress
                                        ) /
                                        ocrPasses.length
                                    );

                                onProgress?.(
                                    progress
                                );
                            }
                        },

                        config: {
                            tessedit_pageseg_mode:
                                pass.mode,

                            ...pass.config,
                        },
                    }
                );

            results.push(result.data.text);
        }


        /* =====================================================
           MERGE OCR RESULTS
        ===================================================== */

        const mergedLines = [];

        for (const text of results) {
            const lines = text
                .split("\n")
                .map((line) =>
                    line.trim()
                )
                .filter(
                    (line) =>
                        line.length > 1
                );

            for (const line of lines) {
                if (
                    !mergedLines.some(
                        (existing) =>
                            existing.toLowerCase() ===
                            line.toLowerCase()
                    )
                ) {
                    mergedLines.push(line);
                }
            }
        }

        const emailRegionText =
            await scanEmailRegion(originalCanvas);

        if (emailRegionText) {
            const emailLines =
                emailRegionText
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(
                        (line) => line.length > 1
                    );

            for (const line of emailLines) {
                if (
                    !mergedLines.some(
                        (existing) =>
                            existing.toLowerCase() ===
                            line.toLowerCase()
                    )
                ) {
                    mergedLines.push(line);
                }
            }
        }

        const finalText =
            mergedLines.join("\n");


        console.log(
            "========== OCR FINAL TEXT =========="
        );

        console.log(finalText);

        return finalText;
    } finally {
        URL.revokeObjectURL(
            originalUrl
        );
    }
}
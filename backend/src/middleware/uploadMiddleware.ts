import type { ErrorRequestHandler } from "express";
import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
        if (file.mimetype !== "application/pdf") {
            return callback(new Error("Hanya file PDF yang diperbolehkan."));
        }

        callback(null, true);
    },
});

export const handleUploadError: ErrorRequestHandler = (
    error,
    _req,
    res,
    next
) => {
    if (error instanceof multer.MulterError) {
        const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

        return res.status(status).json({
            success: false,
            message:
                error.code === "LIMIT_FILE_SIZE"
                    ? "Ukuran file maksimal 5 MB."
                    : "Upload file tidak valid.",
        });
    }

    if (
        error instanceof Error &&
        error.message === "Hanya file PDF yang diperbolehkan."
    ) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }

    next(error);
};

export default upload;

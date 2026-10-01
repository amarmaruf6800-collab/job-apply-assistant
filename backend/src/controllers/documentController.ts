import type { Response } from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.ts";
import prisma from "../lib/prisma.ts";

export async function getDocuments(
    req: AuthenticatedRequest,
    res: Response
) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Tidak terautentikasi.",
            });
        }

        const documents = await prisma.document.findMany({
            where: {
                userId: req.userId,
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                name: true,
                filePath: true,
                mimeType: true,
                fileSize: true,
                isPrimary: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.json({
            success: true,
            documents: documents.map((document) => ({
                ...document,
                id: document.id.toString(),
                fileSize: document.fileSize.toString(),
            })),
        });
    } catch (error) {
        console.error("Get documents error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil daftar dokumen.",
        });
    }
}

export async function getDocumentFile(
    req: AuthenticatedRequest,
    res: Response
) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Tidak terautentikasi.",
            });
        }

        const documentIdParam = req.params.id;

        if (
            typeof documentIdParam !== "string" ||
            !/^[1-9]\d*$/.test(documentIdParam)
        ) {
            return res.status(400).json({
                success: false,
                message: "ID dokumen tidak valid.",
            });
        }

        const document = await prisma.document.findFirst({
            where: {
                id: BigInt(documentIdParam),
                userId: req.userId,
            },
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Dokumen tidak ditemukan.",
            });
        }

        const userUploadDirectory = path.resolve(
            process.cwd(),
            "uploads",
            "users",
            req.userId.toString()
        );
        const filePath = path.resolve(process.cwd(), document.filePath);
        const relativeFilePath = path.relative(
            userUploadDirectory,
            filePath
        );

        if (
            relativeFilePath === "" ||
            relativeFilePath === ".." ||
            relativeFilePath.startsWith(`..${path.sep}`) ||
            path.isAbsolute(relativeFilePath)
        ) {
            console.error(
                "Refusing to access document outside its upload directory."
            );

            return res.status(500).json({
                success: false,
                message: "Lokasi file dokumen tidak valid.",
            });
        }

        try {
            await fs.access(filePath);
        } catch (error) {
            if (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === "ENOENT"
            ) {
                return res.status(404).json({
                    success: false,
                    message: "File dokumen tidak ditemukan.",
                });
            }

            throw error;
        }

        const safeFileName =
            document.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "document.pdf";

        res.setHeader("Content-Type", document.mimeType);
        res.setHeader(
            "Content-Disposition",
            `inline; filename="${safeFileName}"`
        );
        res.setHeader("X-Content-Type-Options", "nosniff");

        return res.sendFile(filePath);
    } catch (error) {
        console.error("Get document file error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil file dokumen.",
        });
    }
}

export async function uploadDocument(
    req: AuthenticatedRequest,
    res: Response
) {
    let filePath: string | undefined;

    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Tidak terautentikasi.",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "File PDF wajib diupload.",
            });
        }

        if (req.file.buffer.subarray(0, 5).toString() !== "%PDF-") {
            return res.status(400).json({
                success: false,
                message: "File yang diupload bukan PDF yang valid.",
            });
        }

        const uploadDirectory = path.join(
            process.cwd(),
            "uploads",
            "users",
            req.userId.toString()
        );

        await fs.mkdir(uploadDirectory, {
            recursive: true,
        });

        const safeFileName = `${crypto.randomUUID()}.pdf`;
        filePath = path.join(uploadDirectory, safeFileName);

        await fs.writeFile(filePath, req.file.buffer, {
            flag: "wx",
        });

        const existingDocuments = await prisma.document.count({
            where: {
                userId: req.userId,
            },
        });

        const document = await prisma.document.create({
            data: {
                userId: req.userId,
                name: req.file.originalname,
                filePath: path
                    .relative(process.cwd(), filePath)
                    .replace(/\\/g, "/"),
                mimeType: req.file.mimetype,
                fileSize: BigInt(req.file.size),
                isPrimary: existingDocuments === 0,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Dokumen berhasil diupload.",
            document: {
                id: document.id.toString(),
                name: document.name,
                filePath: document.filePath,
                mimeType: document.mimeType,
                fileSize: document.fileSize.toString(),
                isPrimary: document.isPrimary,
                createdAt: document.createdAt,
            },
        });
    } catch (error) {
        console.error("Upload document error:", error);

        if (filePath) {
            try {
                await fs.rm(filePath, { force: true });
            } catch (cleanupError) {
                console.error("Upload file cleanup error:", cleanupError);
            }
        }

        return res.status(500).json({
            success: false,
            message: "Gagal mengupload dokumen.",
        });
    }
}

export async function setPrimaryDocument(
    req: AuthenticatedRequest,
    res: Response
) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Tidak terautentikasi.",
            });
        }

        const documentIdParam = req.params.id;

        if (
            typeof documentIdParam !== "string" ||
            !/^[1-9]\d*$/.test(documentIdParam)
        ) {
            return res.status(400).json({
                success: false,
                message: "ID dokumen tidak valid.",
            });
        }

        const documentId = BigInt(documentIdParam);

        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                userId: req.userId,
            },
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Dokumen tidak ditemukan.",
            });
        }

        await prisma.$transaction([
            prisma.document.updateMany({
                where: {
                    userId: req.userId,
                },
                data: {
                    isPrimary: false,
                },
            }),
            prisma.document.update({
                where: {
                    id: documentId,
                },
                data: {
                    isPrimary: true,
                },
            }),
        ]);

        return res.json({
            success: true,
            message: "Dokumen utama berhasil diubah.",
        });
    } catch (error) {
        console.error("Set primary document error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengubah dokumen utama.",
        });
    }
}

export async function deleteDocument(
    req: AuthenticatedRequest,
    res: Response
) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Tidak terautentikasi.",
            });
        }

        const documentIdParam = req.params.id;

        if (
            typeof documentIdParam !== "string" ||
            !/^[1-9]\d*$/.test(documentIdParam)
        ) {
            return res.status(400).json({
                success: false,
                message: "ID dokumen tidak valid.",
            });
        }

        const documentId = BigInt(documentIdParam);
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                userId: req.userId,
            },
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Dokumen tidak ditemukan.",
            });
        }

        const userUploadDirectory = path.resolve(
            process.cwd(),
            "uploads",
            "users",
            req.userId.toString()
        );
        const filePath = path.resolve(process.cwd(), document.filePath);
        const relativeFilePath = path.relative(userUploadDirectory, filePath);

        if (
            relativeFilePath === "" ||
            relativeFilePath === ".." ||
            relativeFilePath.startsWith(`..${path.sep}`) ||
            path.isAbsolute(relativeFilePath)
        ) {
            console.error("Refusing to delete document outside its upload directory.");
            return res.status(500).json({
                success: false,
                message: "Lokasi file dokumen tidak valid.",
            });
        }

        await prisma.$transaction(async (transaction) => {
            await transaction.document.delete({
                where: {
                    id: document.id,
                },
            });

            if (document.isPrimary) {
                const nextDocument = await transaction.document.findFirst({
                    where: {
                        userId: req.userId,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });

                if (nextDocument) {
                    await transaction.document.update({
                        where: {
                            id: nextDocument.id,
                        },
                        data: {
                            isPrimary: true,
                        },
                    });
                }
            }

        });

        try {
            await fs.unlink(filePath);
        } catch (fileError) {
            if (
                typeof fileError === "object" &&
                fileError !== null &&
                "code" in fileError &&
                fileError.code !== "ENOENT"
            ) {
                console.error("Gagal menghapus file dokumen:", fileError);
            }
        }

        return res.json({
            success: true,
            message: "Dokumen berhasil dihapus.",
        });
    } catch (error) {
        console.error("Delete document error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal menghapus dokumen.",
        });
    }
}

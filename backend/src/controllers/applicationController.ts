import type { Response } from "express";
import type { ApplicationMethod, ApplicationStatus } from "../generated/prisma/client.ts";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.ts";
import prisma from "../lib/prisma.ts";

const allowedMethods = new Set([
    "email",
    "whatsapp",
    "website",
    "qr",
    "unknown",
]);

const allowedStatuses = new Set([
    "draft",
    "prepared",
    "sent",
    "rejected",
    "accepted",
]);

function isApplicationMethod(value: unknown): value is ApplicationMethod {
    return typeof value === "string" && allowedMethods.has(value);
}

function isApplicationStatus(value: unknown): value is ApplicationStatus {
    return typeof value === "string" && allowedStatuses.has(value);
}

export async function createApplication(
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

        const {
            company,
            position,
            email,
            subject,
            location,
            applicationMethod,
            whatsapp,
            applicationUrl,
            qrData,
            qrUrl,
            status,
        } = req.body;

        const user = await prisma.user.findUnique({
            where: {
                id: req.userId,
            },
            select: {
                id: true,
                name: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan.",
            });
        }

        const finalApplicationMethod = applicationMethod || "unknown";

        if (!isApplicationMethod(finalApplicationMethod)) {
            return res.status(400).json({
                success: false,
                message: "Application method tidak valid.",
            });
        }

        const finalStatus = status || "draft";

        if (!isApplicationStatus(finalStatus)) {
            return res.status(400).json({
                success: false,
                message: "Status application tidak valid.",
            });
        }

        const normalizedPosition =
            typeof position === "string" ? position.trim() : "";
        const normalizedSubject =
            typeof subject === "string" ? subject.trim() : "";
        const finalSubject =
            normalizedSubject ||
            `Lamaran pekerjaan - ${user.name}`;

        const application = await prisma.application.create({
            data: {
                userId: req.userId,
                company:
                    typeof company === "string" ? company.trim() || null : null,
                position: normalizedPosition || null,
                email:
                    typeof email === "string"
                        ? email.trim().toLowerCase() || null
                        : null,
                subject: finalSubject,
                location:
                    typeof location === "string" ? location.trim() || null : null,
                applicationMethod: finalApplicationMethod,
                whatsapp:
                    typeof whatsapp === "string" ? whatsapp.trim() || null : null,
                applicationUrl:
                    typeof applicationUrl === "string"
                        ? applicationUrl.trim() || null
                        : null,
                qrData:
                    typeof qrData === "string"
                        ? qrData.trim() || null
                        : null,
                qrUrl:
                    typeof qrUrl === "string"
                        ? qrUrl.trim() || null
                        : null,
                status: finalStatus,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Lamaran berhasil disimpan.",
            application: {
                ...application,
                id: application.id.toString(),
                userId: application.userId.toString(),
            },
        });
    } catch (error) {
        console.error("Create application error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal menyimpan lamaran.",
        });
    }
}

export async function deleteApplication(
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

        const applicationIdParam = req.params.id;

        if (
            typeof applicationIdParam !== "string" ||
            !/^[1-9]\d*$/.test(applicationIdParam)
        ) {
            return res.status(400).json({
                success: false,
                message: "ID lamaran tidak valid.",
            });
        }

        const result = await prisma.application.deleteMany({
            where: {
                id: BigInt(applicationIdParam),
                userId: req.userId,
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                success: false,
                message: "Lamaran tidak ditemukan.",
            });
        }

        return res.json({
            success: true,
            message: "Lamaran berhasil dihapus.",
        });
    } catch (error) {
        console.error("Delete application error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal menghapus lamaran.",
        });
    }
}

export async function getApplications(
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

        const applications = await prisma.application.findMany({
            where: {
                userId: req.userId,
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                company: true,
                position: true,
                email: true,
                subject: true,
                location: true,
                applicationMethod: true,
                whatsapp: true,
                applicationUrl: true,
                qrData: true,
                qrUrl: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.json({
            success: true,
            applications: applications.map((application) => ({
                ...application,
                id: application.id.toString(),
            })),
        });
    } catch (error) {
        console.error("Get applications error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil daftar lamaran.",
        });
    }
}

export async function getApplication(
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

        const applicationIdParam = req.params.id;

        if (
            typeof applicationIdParam !== "string" ||
            !/^[1-9]\d*$/.test(applicationIdParam)
        ) {
            return res.status(400).json({
                success: false,
                message: "ID lamaran tidak valid.",
            });
        }

        const application = await prisma.application.findFirst({
            where: {
                id: BigInt(applicationIdParam),
                userId: req.userId,
            },
            select: {
                id: true,
                company: true,
                position: true,
                email: true,
                subject: true,
                location: true,
                applicationMethod: true,
                whatsapp: true,
                applicationUrl: true,
                qrData: true,
                qrUrl: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Lamaran tidak ditemukan.",
            });
        }

        return res.json({
            success: true,
            application: {
                ...application,
                id: application.id.toString(),
            },
        });
    } catch (error) {
        console.error("Get application error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil detail lamaran.",
        });
    }
}

export async function updateApplication(
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

        const applicationIdParam = req.params.id;

        if (
            typeof applicationIdParam !== "string" ||
            !/^[1-9]\d*$/.test(applicationIdParam)
        ) {
            return res.status(400).json({
                success: false,
                message: "ID lamaran tidak valid.",
            });
        }

        const applicationId = BigInt(applicationIdParam);
        const existingApplication = await prisma.application.findFirst({
            where: {
                id: applicationId,
                userId: req.userId,
            },
            select: {
                id: true,
            },
        });

        if (!existingApplication) {
            return res.status(404).json({
                success: false,
                message: "Lamaran tidak ditemukan.",
            });
        }

        const body: unknown = req.body;

        if (
            typeof body !== "object" ||
            body === null ||
            Array.isArray(body)
        ) {
            return res.status(400).json({
                success: false,
                message: "Data lamaran tidak valid.",
            });
        }

        const fields = body as Record<string, unknown>;
        const data: {
            company?: string | null;
            position?: string | null;
            email?: string | null;
            subject?: string | null;
            location?: string | null;
            applicationMethod?: ApplicationMethod;
            whatsapp?: string | null;
            applicationUrl?: string | null;
            qrData?: string | null;
            qrUrl?: string | null;
            status?: ApplicationStatus;
        } = {};

        const stringFields = [
            "company",
            "position",
            "email",
            "subject",
            "location",
            "whatsapp",
            "applicationUrl",
            "qrData",
            "qrUrl",
        ] as const;

        if (
            !stringFields.some((field) =>
                Object.prototype.hasOwnProperty.call(fields, field)
            ) &&
            !Object.prototype.hasOwnProperty.call(fields, "applicationMethod") &&
            !Object.prototype.hasOwnProperty.call(fields, "status")
        ) {
            return res.status(400).json({
                success: false,
                message: "Tidak ada data lamaran untuk diperbarui.",
            });
        }

        for (const field of stringFields) {
            if (Object.prototype.hasOwnProperty.call(fields, field)) {
                const value = fields[field];

                if (value !== null && typeof value !== "string") {
                    return res.status(400).json({
                        success: false,
                        message: `Field ${field} harus berupa teks atau null.`,
                    });
                }

                const normalizedValue =
                    typeof value === "string" ? value.trim() : null;

                if (field === "email") {
                    data.email = normalizedValue?.toLowerCase() || null;
                } else {
                    data[field] = normalizedValue || null;
                }
            }

        }

        if (Object.prototype.hasOwnProperty.call(fields, "applicationMethod")) {
            if (!isApplicationMethod(fields.applicationMethod)) {
                return res.status(400).json({
                    success: false,
                    message: "Application method tidak valid.",
                });
            }

            data.applicationMethod = fields.applicationMethod;
        }

        if (Object.prototype.hasOwnProperty.call(fields, "status")) {
            if (!isApplicationStatus(fields.status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status application tidak valid.",
                });
            }

            data.status = fields.status;
        }

        const updatedApplication = await prisma.application.update({
            where: {
                id: applicationId,
            },
            data,
            select: {
                id: true,
                company: true,
                position: true,
                email: true,
                subject: true,
                location: true,
                applicationMethod: true,
                whatsapp: true,
                applicationUrl: true,
                qrData: true,
                qrUrl: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.json({
            success: true,
            message: "Lamaran berhasil diperbarui.",
            application: {
                ...updatedApplication,
                id: updatedApplication.id.toString(),
            },
        });
    } catch (error) {
        console.error("Update application error:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal memperbarui lamaran.",
        });
    }
}

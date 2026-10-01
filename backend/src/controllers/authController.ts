import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.ts";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.ts";

export async function register(
    req: Request,
    res: Response
) {
    try {
        const { name, email, password } = req.body;

        // Validasi dasar
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Nama, email, dan password wajib diisi.",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password minimal 6 karakter.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Cek apakah email sudah terdaftar
        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email sudah terdaftar.",
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Buat user
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Akun berhasil dibuat.",
            user: {
                ...user,
                id: user.id.toString(),
            },
        });
    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server.",
        });
    }
}

export async function login(
    req: Request,
    res: Response
) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email dan password wajib diisi.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah.",
            });
        }

        const passwordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah.",
            });
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET belum diatur.");
        }

        const token = jwt.sign(
            {
                userId: user.id.toString(),
            },
            jwtSecret,
            {
                expiresIn: "7d",
            }
        );

        return res.json({
            success: true,
            message: "Login berhasil.",
            token,
            user: {
                id: user.id.toString(),
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server.",
        });
    }
}

export async function me(
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

        const user = await prisma.user.findUnique({
            where: {
                id: req.userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan.",
            });
        }

        return res.json({
            success: true,
            user: {
                ...user,
                id: user.id.toString(),
            },
        });
    } catch (error) {
        console.error("Get current user error:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server.",
        });
    }
}
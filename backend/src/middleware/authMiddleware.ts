import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
    userId?: bigint;
}

export function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Token tidak ditemukan.",
            });
        }

        const [scheme, token] = authHeader.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({
                success: false,
                message: "Format token tidak valid.",
            });
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET belum diatur.");
        }

        const payload = jwt.verify(token, jwtSecret);

        if (
            typeof payload !== "object" ||
            payload === null ||
            !("userId" in payload)
        ) {
            return res.status(401).json({
                success: false,
                message: "Token tidak valid.",
            });
        }

        req.userId = BigInt(String(payload.userId));

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);

        return res.status(401).json({
            success: false,
            message: "Token tidak valid atau sudah kedaluwarsa.",
        });
    }
}

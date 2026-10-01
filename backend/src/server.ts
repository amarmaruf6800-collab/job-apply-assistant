import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./lib/prisma.ts";
import authRoutes from "./routes/authRoutes.ts";
import documentRoutes from "./routes/documentRoutes.ts";
import applicationRoutes from "./routes/applicationRoutes.ts";

const app = express();

const PORT = Number(process.env.PORT) || 5000;

app.use(
    cors({
        origin: "http://localhost:5173",
    })
);

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/applications", applicationRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend Job Apply Assistant berjalan.",
    });
});

app.get("/api/health/db", async (req, res) => {
    try {
        const result = await prisma.$queryRaw<
            { now: Date }[]
        >`SELECT NOW() AS now`;

        res.json({
            success: true,
            message: "PostgreSQL berhasil terhubung.",
            databaseTime: result[0].now,
        });
    } catch (error) {
        console.error("Database health check error:", error);

        res.status(500).json({
            success: false,
            message: "Gagal terhubung ke PostgreSQL.",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
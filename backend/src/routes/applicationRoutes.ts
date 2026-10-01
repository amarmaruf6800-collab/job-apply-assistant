import { Router } from "express";
import {
    createApplication,
    deleteApplication,
    getApplication,
    getApplications,
    updateApplication,
} from "../controllers/applicationController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router();

router.get("/", authMiddleware, getApplications);
router.post("/", authMiddleware, createApplication);
router.get("/:id", authMiddleware, getApplication);
router.patch("/:id", authMiddleware, updateApplication);
router.delete("/:id", authMiddleware, deleteApplication);

export default router;

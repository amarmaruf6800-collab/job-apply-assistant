import { Router } from "express";
import {
    getDocuments,
    setPrimaryDocument,
    uploadDocument,
    deleteDocument,
    getDocumentFile,
} from "../controllers/documentController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import upload, { handleUploadError } from "../middleware/uploadMiddleware.ts";

const router = Router();

router.get("/", authMiddleware, getDocuments);
router.get("/:id/file", authMiddleware, getDocumentFile);
router.post(
    "/",
    authMiddleware,
    upload.single("file"),
    uploadDocument,
    handleUploadError
);
router.patch("/:id/primary", authMiddleware, setPrimaryDocument);
router.delete("/:id", authMiddleware, deleteDocument);

export default router;

import { useEffect, useRef, useState } from "react";
import {
    FileText,
    Upload,
    Trash2,
    CheckCircle2,
} from "lucide-react";

import { api } from "../services/api";

function Documents() {
    const inputRef = useRef(null);

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");

    // =========================================================
    // LOAD DOCUMENTS
    // =========================================================

    const loadDocuments = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await api.get("/documents");

            setDocuments(data.documents || []);
        } catch (error) {
            console.error("Gagal mengambil dokumen:", error);

            setError(
                error.message ||
                "Gagal mengambil daftar CV."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    // =========================================================
    // UPLOAD DOCUMENT
    // =========================================================

    const handleUpload = async (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        // Validasi tipe file
        if (file.type !== "application/pdf") {
            alert("CV harus berupa file PDF.");
            event.target.value = "";
            return;
        }

        // Validasi ukuran
        const maxSize = 10 * 1024 * 1024; // 10 MB

        if (file.size > maxSize) {
            alert("Ukuran CV maksimal 10 MB.");
            event.target.value = "";
            return;
        }

        try {
            setUploading(true);
            setError("");

            const formData = new FormData();

            formData.append("file", file);

            const data = await api.post(
                "/documents",
                formData
            );

            console.log(
                "Dokumen berhasil diupload:",
                data
            );

            // Refresh dari backend
            await loadDocuments();
        } catch (error) {
            console.error(
                "Gagal upload dokumen:",
                error
            );

            setError(
                error.message ||
                "Gagal mengupload CV."
            );
        } finally {
            setUploading(false);

            // Reset input supaya file yang sama
            // bisa dipilih lagi
            event.target.value = "";
        }
    };

    // =========================================================
    // DELETE DOCUMENT
    // =========================================================

    const deleteDocument = async (id) => {
        const confirmed = window.confirm(
            "Hapus CV ini?"
        );

        if (!confirmed) return;

        try {
            setDeletingId(id);
            setError("");

            await api.delete(
                `/documents/${id}`
            );

            // Hapus dari state setelah backend berhasil
            setDocuments((current) =>
                current.filter(
                    (document) =>
                        document.id !== id
                )
            );
        } catch (error) {
            console.error(
                "Gagal menghapus dokumen:",
                error
            );

            setError(
                error.message ||
                "Gagal menghapus CV."
            );
        } finally {
            setDeletingId(null);
        }
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="page documents-page">
            <header className="documents-header">
                <div>
                    <p className="section-eyebrow">
                        DOCUMENTS
                    </p>

                    <h1>CV Saya</h1>

                    <p>
                        Simpan CV yang sering kamu
                        gunakan untuk melamar
                        pekerjaan.
                    </p>
                </div>
            </header>

            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                hidden
                onChange={handleUpload}
            />

            {/* Upload button */}
            <button
                type="button"
                className="cv-upload-button"
                onClick={() =>
                    inputRef.current?.click()
                }
                disabled={uploading}
            >
                <Upload size={19} />

                {uploading
                    ? "Mengupload..."
                    : "Upload CV"}
            </button>

            {/* Error */}
            {error && (
                <div className="documents-error">
                    {error}
                </div>
            )}

            <section className="documents-list">
                {/* Loading */}
                {loading ? (
                    <div className="documents-empty">
                        <div className="empty-icon">
                            <FileText size={25} />
                        </div>

                        <h2>
                            Memuat CV...
                        </h2>

                        <p>
                            Mengambil data CV
                            dari server.
                        </p>
                    </div>
                ) : documents.length === 0 ? (
                    /* Empty */
                    <div className="documents-empty">
                        <div className="empty-icon">
                            <FileText size={25} />
                        </div>

                        <h2>
                            Belum ada CV
                        </h2>

                        <p>
                            Upload CV PDF kamu
                            untuk digunakan saat
                            membuat lamaran.
                        </p>
                    </div>
                ) : (
                    /* Documents */
                    documents.map((document) => (
                        <div
                            className="document-card"
                            key={document.id}
                        >
                            <div className="document-icon">
                                <FileText size={22} />
                            </div>

                            <div className="document-info">
                                <strong>
                                    {document.name}
                                </strong>

                                <span>
                                    PDF ·{" "}
                                    {formatSize(
                                        document.fileSize
                                    )}
                                </span>
                            </div>

                            <div className="document-actions">
                                {document.isPrimary && (
                                    <CheckCircle2
                                        size={18}
                                    />
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        deleteDocument(
                                            document.id
                                        )
                                    }
                                    aria-label="Hapus CV"
                                    disabled={
                                        deletingId ===
                                        document.id
                                    }
                                >
                                    <Trash2
                                        size={17}
                                    />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
}

// =========================================================
// FORMAT FILE SIZE
// =========================================================

function formatSize(bytes) {
    if (!bytes) return "0 KB";

    const mb = bytes / 1024 / 1024;

    if (mb >= 1) {
        return `${mb.toFixed(1)} MB`;
    }

    return `${Math.round(bytes / 1024)} KB`;
}

export default Documents;
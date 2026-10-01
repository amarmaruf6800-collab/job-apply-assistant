import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    ExternalLink,
    FileText,
    Link2,
    Mail,
    Phone,
    QrCode,
    Send,
} from "lucide-react";

import { api } from "../services/api";
import { createGmailDraft } from "../services/gmailService";

function normalizeUrl(url) {
    if (!url) return "";

    const value = url.trim();

    if (
        value.startsWith("http://") ||
        value.startsWith("https://")
    ) {
        return value;
    }

    return `https://${value}`;
}

function normalizeWhatsapp(phone) {
    if (!phone) return "";

    let value = phone.replace(/[^\d+]/g, "");

    if (value.startsWith("+62")) {
        value = "62" + value.slice(3);
    } else if (value.startsWith("0")) {
        value = "62" + value.slice(1);
    } else if (!value.startsWith("62")) {
        value = `62${value}`;
    }

    return value;
}

function PrepareApplication({ onNavigate }) {
    const [job, setJob] = useState(null);
    const [documents, setDocuments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isCreatingDraft, setIsCreatingDraft] =
        useState(false);

    const [gmailError, setGmailError] = useState("");

    const [selectedDocument, setSelectedDocument] =
        useState("");

    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    useEffect(() => {
        loadPrepareData();
    }, []);

    const loadPrepareData = async () => {
        try {
            setLoading(true);
            setError("");

            const applicationId =
                sessionStorage.getItem("applicationId");
            const savedJob =
                sessionStorage.getItem("scannedJob");

            if (!applicationId) {
                setError(
                    "ID lamaran tidak ditemukan."
                );
                return;
            }

            const applicationData = await api.get(
                `/applications/${encodeURIComponent(applicationId)}`
            );
            const databaseJob =
                applicationData.application;

            if (!databaseJob) {
                setError(
                    "Data lamaran tidak ditemukan di server."
                );
                return;
            }

            let scannedData = {};

            if (savedJob) {
                try {
                    const parsedScannedData =
                        JSON.parse(savedJob);

                    if (
                        parsedScannedData &&
                        typeof parsedScannedData === "object" &&
                        !Array.isArray(parsedScannedData)
                    ) {
                        scannedData = parsedScannedData;
                    } else {
                        console.warn(
                            "Data scan tambahan bukan object yang valid."
                        );
                    }
                } catch (error) {
                    console.error(
                        "Gagal membaca data scan tambahan:",
                        error
                    );
                }
            }

            const hydratedJob = {
                ...scannedData,
                ...databaseJob,
                qrData:
                    databaseJob.qrData ||
                    scannedData.qrData ||
                    "",
                qrUrl:
                    databaseJob.qrUrl ||
                    scannedData.qrUrl ||
                    "",
            };

            setJob(hydratedJob);

            if (databaseJob.email) {
                // Profil dan CV hanya dibutuhkan untuk alur draft Gmail.
                const [meData, documentsData] =
                    await Promise.all([
                        api.get("/auth/me"),
                        api.get("/documents"),
                    ]);

                const currentUser =
                    meData.user || null;

                const loadedDocuments =
                    documentsData.documents || [];

                setDocuments(loadedDocuments);

                setSubject(
                    databaseJob.subject ||
                    `Lamaran pekerjaan - ${currentUser?.name ||
                    "Nama Anda"
                    }`
                );

                setBody(
                    createEmailBody(
                        currentUser?.name
                    )
                );

                const primaryDocument =
                    loadedDocuments.find(
                        (document) =>
                            document.isPrimary
                    );

                if (primaryDocument) {
                    setSelectedDocument(
                        String(primaryDocument.id)
                    );
                } else if (
                    loadedDocuments.length > 0
                ) {
                    setSelectedDocument(
                        String(
                            loadedDocuments[0].id
                        )
                    );
                }
            }
        } catch (error) {
            console.error(
                "Gagal memuat data prepare application:",
                error
            );

            setError(
                error.message ||
                "Gagal memuat data lamaran."
            );
        } finally {
            setLoading(false);
        }
    };

    const selectedCV = useMemo(() => {
        return documents.find(
            (document) =>
                String(document.id) ===
                String(selectedDocument)
        );
    }, [
        documents,
        selectedDocument,
    ]);

    const getCVFile = async (document) => {
        const token =
            localStorage.getItem("token");

        const response = await fetch(
            `/api/documents/${document.id}/file`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(
                "Gagal mengambil file CV dari server."
            );
        }

        const blob =
            await response.blob();

        return new File(
            [blob],
            document.name ||
            "CV.pdf",
            {
                type:
                    document.mimeType ||
                    "application/pdf",
            }
        );
    };

    const openGmail = async () => {
        if (!job?.email) {
            alert(
                "Email perusahaan belum terdeteksi."
            );
            return;
        }

        if (!selectedCV) {
            alert(
                "Silakan pilih CV terlebih dahulu."
            );
            return;
        }

        const gmailWindow =
            window.open(
                "about:blank",
                "_blank"
            );

        try {
            setIsCreatingDraft(true);
            setGmailError("");

            // Ambil file CV asli dari backend
            const cvFile =
                await getCVFile(
                    selectedCV
                );

            // Buat draft Gmail
            await createGmailDraft({
                to: job.email,
                subject,
                body,
                file: cvFile,
            });

            // Gmail berhasil dibuat.
            // Sekarang update status lamaran di PostgreSQL.
            await api.patch(
                `/applications/${job.id}`,
                {
                    status: "prepared",
                }
            );

            const draftsUrl =
                "https://mail.google.com/mail/u/0/#drafts";

            if (gmailWindow) {
                gmailWindow.location.href =
                    draftsUrl;
            } else {
                window.location.assign(
                    draftsUrl
                );
            }
        } catch (error) {
            gmailWindow?.close();

            console.error(
                "Gagal membuat draft Gmail:",
                error
            );

            setGmailError(
                error.message ||
                "Gagal membuat draft Gmail."
            );
        } finally {
            setIsCreatingDraft(false);
        }
    };

    if (loading) {
        return (
            <div className="page placeholder-page">
                <p className="section-eyebrow">
                    APPLICATION
                </p>

                <h1>Siapkan Lamaran</h1>

                <p>
                    Memuat data lamaran dan CV...
                </p>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="page placeholder-page">
                <p className="section-eyebrow">
                    APPLICATION
                </p>

                <h1>
                    Data tidak ditemukan
                </h1>

                <p>
                    {error ||
                        "Silakan pilih lamaran terlebih dahulu."}
                </p>

                <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                        onNavigate(
                            "applications"
                        )
                    }
                >
                    Kembali ke Lamaran
                </button>
            </div>
        );
    }

    return (
        <div className="page prepare-page">
            <header className="scan-header">
                <button
                    type="button"
                    className="back-button"
                    onClick={() =>
                        onNavigate(
                            "applications"
                        )
                    }
                >
                    <ArrowLeft size={19} />
                </button>

                <div>
                    <p className="section-eyebrow">
                        APPLICATION
                    </p>

                    <h1>
                        Siapkan Lamaran
                    </h1>
                </div>
            </header>

            {/* COMPANY */}
            <section className="prepare-company">
                <div className="prepare-company-icon">
                    <Mail size={20} />
                </div>

                <div>
                    <p>Melamar ke</p>

                    <strong>
                        {job.company ||
                            "Perusahaan tidak diketahui"}
                    </strong>

                    <span>
                        {job.position ||
                            "Posisi tidak diketahui"}
                    </span>
                </div>
            </section>

            {/* APPLICATION METHODS */}
            <section className="prepare-card">
                <div className="prepare-card-heading">
                    <p className="section-eyebrow">
                        APPLICATION METHOD
                    </p>

                    <h2>Cara Mendaftar</h2>

                    <p>
                        Gunakan salah satu metode pendaftaran
                        yang tersedia pada lowongan ini.
                    </p>
                </div>

                <div className="application-methods">
                    {job.email && (
                        <div className="application-method">
                            <div className="application-method-icon">
                                <Mail size={18} />
                            </div>

                            <div className="application-method-content">
                                <strong>Email</strong>
                                <span>{job.email}</span>
                            </div>

                            <span className="application-method-status">
                                Tersedia
                            </span>
                        </div>
                    )}

                    {job.whatsapp && (
                        <div className="application-method">
                            <div className="application-method-icon">
                                <Phone size={18} />
                            </div>

                            <div className="application-method-content">
                                <strong>WhatsApp</strong>
                                <span>{job.whatsapp}</span>
                            </div>

                            <a
                                href={`https://wa.me/${normalizeWhatsapp(
                                    job.whatsapp
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="application-method-action"
                            >
                                Buka
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    )}

                    {job.applicationUrl && (
                        <div className="application-method">
                            <div className="application-method-icon">
                                <Link2 size={18} />
                            </div>

                            <div className="application-method-content">
                                <strong>Link Pendaftaran</strong>
                                <span>{job.applicationUrl}</span>
                            </div>

                            <a
                                href={normalizeUrl(
                                    job.applicationUrl
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="application-method-action"
                            >
                                Buka
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    )}

                    {job.qrData && (
                        <div className="application-method">
                            <div className="application-method-icon">
                                <QrCode size={18} />
                            </div>

                            <div className="application-method-content">
                                <strong>QR Code</strong>
                                <span>
                                    {job.qrUrl
                                        ? job.qrUrl
                                        : "QR Code berhasil dibaca"}
                                </span>
                            </div>

                            {job.qrUrl && (
                                <a
                                    href={normalizeUrl(job.qrUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="application-method-action"
                                >
                                    Buka
                                    <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    )}

                    {!job.email &&
                        !job.whatsapp &&
                        !job.applicationUrl &&
                        !job.qrData && (
                            <div className="application-method-empty">
                                <strong>
                                    Metode pendaftaran belum terdeteksi
                                </strong>

                                <span>
                                    Silakan periksa kembali poster
                                    atau instruksi pendaftaran.
                                </span>
                            </div>
                        )}
                </div>
            </section>

            {/* CV */}
            {job.email && (
                <section className="prepare-card">
                <div className="prepare-card-heading">
                    <p className="section-eyebrow">
                        CV
                    </p>

                    <h2>Pilih CV</h2>

                    <p>
                        Pilih CV yang akan
                        digunakan untuk
                        lamaran ini.
                    </p>
                </div>

                {documents.length === 0 ? (
                    <div className="no-cv">
                        <FileText size={22} />

                        <div>
                            <strong>
                                Belum ada CV
                            </strong>

                            <p>
                                Upload CV terlebih
                                dahulu.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                onNavigate(
                                    "documents"
                                )
                            }
                        >
                            Upload CV
                        </button>
                    </div>
                ) : (
                    <div className="cv-options">
                        {documents.map(
                            (document) => {
                                const selected =
                                    String(
                                        document.id
                                    ) ===
                                    String(
                                        selectedDocument
                                    );

                                return (
                                    <button
                                        type="button"
                                        key={
                                            document.id
                                        }
                                        className={`cv-option ${selected
                                                ? "selected"
                                                : ""
                                            }`}
                                        onClick={() =>
                                            setSelectedDocument(
                                                String(
                                                    document.id
                                                )
                                            )
                                        }
                                    >
                                        <div className="cv-option-icon">
                                            <FileText
                                                size={
                                                    20
                                                }
                                            />
                                        </div>

                                        <div>
                                            <strong>
                                                {
                                                    document.name
                                                }
                                            </strong>

                                            <span>
                                                PDF ·{" "}
                                                {formatSize(
                                                    document.fileSize ??
                                                    document.size
                                                )}
                                            </span>
                                        </div>

                                        {selected && (
                                            <CheckCircle2
                                                size={
                                                    19
                                                }
                                            />
                                        )}
                                    </button>
                                );
                            }
                        )}
                    </div>
                )}
                </section>
            )}

            {job.email ? (
                <>
                    {/* EMAIL */}
                    <section className="prepare-card">
                        <div className="prepare-card-heading">
                            <p className="section-eyebrow">
                                EMAIL
                            </p>

                            <h2>
                                Preview Email
                            </h2>

                            <p>
                                Periksa email sebelum
                                membukanya di Gmail.
                            </p>
                        </div>

                        <div className="email-field">
                            <label>Kepada</label>

                            <div className="email-value">
                                <Mail size={15} />

                                {job.email ||
                                    "Email belum terdeteksi"}
                            </div>
                        </div>

                        <div className="email-field">
                            <label>Subject</label>

                            <input
                                value={subject}
                                onChange={(event) =>
                                    setSubject(
                                        event.target
                                            .value
                                    )
                                }
                            />
                        </div>

                        <div className="email-field">
                            <label>
                                Isi Email
                            </label>

                            <textarea
                                value={body}
                                onChange={(event) =>
                                    setBody(
                                        event.target
                                            .value
                                    )
                                }
                                rows={12}
                            />
                        </div>
                    </section>

                    {/* READY */}
                    <section className="prepare-send">
                        <div>
                            <p className="section-eyebrow">
                                READY
                            </p>

                            <h2>
                                {selectedCV
                                    ? selectedCV.name
                                    : "Belum memilih CV"}
                            </h2>

                            <p>
                                Draft Gmail akan dibuat
                                dengan email dan CV
                                terlampir.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="primary-button"
                            onClick={openGmail}
                            disabled={
                                !job.email ||
                                !selectedCV ||
                                isCreatingDraft
                            }
                        >
                            <Send size={18} />

                            {isCreatingDraft
                                ? "Membuat Draft..."
                                : "Buat Draft Gmail"}
                        </button>
                    </section>
                </>
            ) : (
                <section className="prepare-send">
                    <div>
                        <p className="section-eyebrow">
                            READY
                        </p>

                        <h2>
                            Lamaran siap dilanjutkan
                        </h2>

                        <p>
                            Gunakan metode pendaftaran
                            yang tersedia di atas.
                        </p>
                    </div>
                </section>
            )}

            {gmailError && (
                <div className="scan-error">
                    <strong>
                        Gmail gagal
                    </strong>

                    <p>
                        {gmailError}
                    </p>
                </div>
            )}

            {job.email && (
                <div className="prepare-note">
                    <strong>
                        Catatan
                    </strong>

                    <p>
                        Pastikan penerima, subject,
                        isi email, dan lampiran CV
                        sudah benar sebelum mengirim
                        draft.
                    </p>
                </div>
            )}
        </div>
    );
}

function createEmailBody(userName) {
    const name =
        userName || "Nama Anda";

    return `Yth. Tim HRD,

Saya bermaksud mengajukan lamaran pekerjaan melalui email ini.

Saya tertarik dengan kesempatan yang tersedia dan berharap dapat diberikan kesempatan untuk mengikuti proses seleksi lebih lanjut.

Sebagai bahan pertimbangan, saya melampirkan CV saya pada email ini.

Terima kasih atas waktu dan perhatiannya.

Hormat saya,
${name}`;
}

function formatSize(bytes) {
    if (!bytes) return "0 KB";

    const mb =
        Number(bytes) /
        1024 /
        1024;

    if (mb >= 1) {
        return `${mb.toFixed(1)} MB`;
    }

    return `${Math.round(
        Number(bytes) / 1024
    )} KB`;
}

export default PrepareApplication;
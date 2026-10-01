import { useEffect, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    ExternalLink,
    Link2,
    Mail,
    MapPin,
    Phone,
    QrCode,
    Send,
} from "lucide-react";

import { api } from "../services/api";

function Review({ onNavigate }) {
    const [job, setJob] = useState({
        company: "",
        position: "",
        location: "",
        email: "",
        subject: "",
        applicationMethod: "unknown",
        whatsapp: "",
        applicationUrl: "",
        qrData: "",
        qrUrl: "",
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    useEffect(() => {
        const savedJob = sessionStorage.getItem("scannedJob");

        if (savedJob) {
            try {
                setJob(JSON.parse(savedJob));
            } catch (error) {
                console.error(
                    "Gagal membaca data lowongan:",
                    error
                );
            }
        }
    }, []);

    const updateField = (field, value) => {
        setJob((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const updateQrData = (value) => {
        const qrUrl = getExternalUrl(value);

        setJob((current) => ({
            ...current,
            qrData: value,
            qrUrl,
        }));
    };

    const saveJob = async () => {
        if (isSaving) return;

        try {
            setIsSaving(true);
            setSaveError("");

            const payload = {
                company:
                    job.company?.trim() || null,

                position:
                    job.position?.trim() || null,

                email:
                    job.email?.trim() || null,

                subject:
                    job.subject?.trim() || null,

                location:
                    job.location?.trim() || null,

                applicationMethod:
                    job.applicationMethod || "unknown",

                whatsapp:
                    job.whatsapp?.trim() || null,

                applicationUrl:
                    job.applicationUrl?.trim() || null,

                qrData:
                    job.qrData?.trim() || null,

                qrUrl:
                    job.qrUrl?.trim() || null,

                status: "draft",
            };

            const result = await api.post(
                "/applications",
                payload
            );

            console.log(
                "Lamaran berhasil disimpan:",
                result
            );

            const applicationId =
                result.application?.id;

            if (!applicationId) {
                throw new Error(
                    "ID lamaran tidak diterima dari server."
                );
            }

            sessionStorage.setItem(
                "applicationId",
                String(applicationId)
            );

            sessionStorage.setItem(
                "scannedJob",
                JSON.stringify(job)
            );

            onNavigate("prepare");
        } catch (error) {
            console.error(
                "Gagal menyimpan lamaran:",
                error
            );

            setSaveError(
                error.message ||
                "Gagal menyimpan lamaran ke server."
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="page review-page">
            <header className="scan-header">
                <button
                    type="button"
                    className="back-button"
                    onClick={() => onNavigate("scan")}
                >
                    <ArrowLeft size={19} />
                </button>

                <div>
                    <p className="section-eyebrow">
                        SCAN RESULT
                    </p>

                    <h1>Hasil Scan</h1>

                    <p>
                        Periksa kembali informasi lowongan
                        sebelum melanjutkan.
                    </p>
                </div>
            </header>

            <section className="review-card">
                <div className="review-card-header">
                    <div>
                        <p className="section-eyebrow">
                            JOB INFORMATION
                        </p>

                        <h2>Informasi Lowongan</h2>
                    </div>

                    <CheckCircle2 size={22} />
                </div>

                <ReviewField
                    label="Perusahaan"
                    value={job.company}
                    onChange={(value) =>
                        updateField(
                            "company",
                            value
                        )
                    }
                />

                <ReviewField
                    label="Posisi"
                    value={job.position}
                    onChange={(value) =>
                        updateField(
                            "position",
                            value
                        )
                    }
                />

                <ReviewField
                    label="Email Perusahaan"
                    value={job.email}
                    icon={<Mail size={16} />}
                    onChange={(value) =>
                        updateField(
                            "email",
                            value
                        )
                    }
                />

                <ReviewField
                    label="Subject"
                    value={job.subject}
                    onChange={(value) =>
                        updateField(
                            "subject",
                            value
                        )
                    }
                />

                <ReviewField
                    label="Lokasi"
                    value={job.location}
                    icon={<MapPin size={16} />}
                    onChange={(value) =>
                        updateField(
                            "location",
                            value
                        )
                    }
                />
            </section>

            {(job.email ||
                job.whatsapp ||
                job.applicationUrl ||
                job.qrData) && (
                <section className="review-card">
                    <div className="review-card-header">
                        <div>
                            <p className="section-eyebrow">
                                APPLICATION METHOD
                            </p>

                            <h2>Cara Mendaftar</h2>
                        </div>
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
                            </div>
                        )}

                        {job.whatsapp && (
                            <div className="application-method">
                                <div className="application-method-icon">
                                    <Phone size={18} />
                                </div>

                                <div className="application-method-content">
                                    <strong>WhatsApp</strong>

                                    <input
                                        aria-label="Nomor WhatsApp"
                                        value={job.whatsapp}
                                        onChange={(event) =>
                                            updateField(
                                                "whatsapp",
                                                event.target.value
                                            )
                                        }
                                    />
                                </div>

                                {getWhatsAppUrl(job.whatsapp) && (
                                    <a
                                        className="application-method-action"
                                        href={getWhatsAppUrl(job.whatsapp)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Buka
                                        <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        )}

                        {job.applicationUrl && (
                            <div className="application-method">
                                <div className="application-method-icon">
                                    <Link2 size={18} />
                                </div>

                                <div className="application-method-content">
                                    <strong>Link Pendaftaran</strong>

                                    <input
                                        aria-label="Link pendaftaran"
                                        value={job.applicationUrl}
                                        onChange={(event) =>
                                            updateField(
                                                "applicationUrl",
                                                event.target.value
                                            )
                                        }
                                    />
                                </div>

                                {getExternalUrl(job.applicationUrl) && (
                                    <a
                                        className="application-method-action"
                                        href={getExternalUrl(job.applicationUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Buka
                                        <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        )}

                        {job.qrData && (
                            <div className="application-method">
                                <div className="application-method-icon">
                                    <QrCode size={18} />
                                </div>

                                <div className="application-method-content">
                                    <strong>QR Code</strong>

                                    <input
                                        aria-label="Data QR Code"
                                        value={job.qrData}
                                        onChange={(event) =>
                                            updateQrData(
                                                event.target.value
                                            )
                                        }
                                    />
                                </div>

                                {getExternalUrl(
                                    job.qrUrl || job.qrData
                                ) && (
                                    <a
                                        className="application-method-action"
                                        href={getExternalUrl(
                                            job.qrUrl || job.qrData
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Buka
                                        <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}

            <section className="review-next">
                <div>
                    <p className="section-eyebrow">
                        NEXT STEP
                    </p>

                    <h2>Siapkan lamaran</h2>

                    <p>
                        Data ini akan disimpan ke riwayat
                        lamaran kamu.
                    </p>
                </div>

                {saveError && (
                    <div className="scan-error">
                        <strong>Gagal menyimpan</strong>

                        <p>{saveError}</p>
                    </div>
                )}

                <button
                    type="button"
                    className="primary-button"
                    onClick={saveJob}
                    disabled={isSaving}
                >
                    <Send size={18} />

                    {isSaving
                        ? "Menyimpan..."
                        : "Simpan Lamaran"}
                </button>
            </section>
        </div>
    );
}

function getExternalUrl(value) {
    const trimmedValue = value?.trim();

    if (!trimmedValue) return "";

    const candidate = /^https?:\/\//i.test(trimmedValue)
        ? trimmedValue
        : `https://${trimmedValue}`;

    try {
        const url = new URL(candidate);

        return ["http:", "https:"].includes(url.protocol)
            ? url.href
            : "";
    } catch {
        return "";
    }
}

function getWhatsAppUrl(phone) {
    let number = phone?.replace(/\D/g, "") || "";

    if (number.startsWith("0")) {
        number = `62${number.slice(1)}`;
    }

    if (number.length < 8) return "";

    return `https://wa.me/${number}`;
}

function ReviewField({
    label,
    value,
    onChange,
    icon,
}) {
    return (
        <div className="review-field">
            <label>{label}</label>

            <div className="review-input-wrapper">
                {icon}

                <input
                    value={value || ""}
                    onChange={(event) =>
                        onChange(
                            event.target.value
                        )
                    }
                    placeholder="Tidak terdeteksi"
                />

                {!value && (
                    <span className="field-warning">
                        Belum terdeteksi
                    </span>
                )}
            </div>
        </div>
    );
}

export default Review;
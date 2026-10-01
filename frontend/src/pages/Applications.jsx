import { useEffect, useState } from "react";
import {
    BriefcaseBusiness,
    Clock3,
    FileText,
    Mail,
    MapPin,
    Trash2,
} from "lucide-react";

import ApplicationCard from "../components/ApplicationCard";
import { api } from "../services/api";

function Applications({ onNavigate }) {
    const [applications, setApplications] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            setLoading(true);
            setError("");

            const result = await api.get(
                "/applications"
            );

            setApplications(
                result.applications || []
            );
        } catch (error) {
            console.error(
                "Gagal mengambil applications:",
                error
            );

            setError(
                error.message ||
                "Gagal mengambil data lamaran."
            );
        } finally {
            setLoading(false);
        }
    };

    const deleteApplication = async (id) => {
        const confirmed = window.confirm(
            "Hapus lamaran ini?"
        );

        if (!confirmed) return;

        try {
            setError("");

            await api.delete(
                `/applications/${id}`
            );

            // Ambil ulang data dari backend
            await loadApplications();
        } catch (error) {
            console.error(
                "Gagal menghapus application:",
                error
            );

            setError(
                error.message ||
                "Gagal menghapus lamaran."
            );
        }
    };

    const openApplication = (application) => {
        sessionStorage.setItem(
            "applicationId",
            String(application.id)
        );
        sessionStorage.removeItem("scannedJob");

        onNavigate("prepare");
    };

    const draftCount = applications.filter(
        (application) =>
            application.status?.toLowerCase() ===
            "draft"
    ).length;

    return (
        <div className="page applications-page">
            <header className="applications-header">
                <div>
                    <p className="section-eyebrow">
                        APPLICATIONS
                    </p>

                    <h1>Lamaran</h1>

                    <p className="applications-description">
                        Semua lowongan yang sudah kamu
                        simpan.
                    </p>
                </div>
            </header>

            {loading ? (
                <div className="applications-empty">
                    <div className="empty-icon">
                        <FileText size={24} />
                    </div>

                    <h2>Memuat lamaran...</h2>

                    <p>
                        Sedang mengambil data dari
                        server.
                    </p>
                </div>
            ) : error ? (
                <div className="applications-empty">
                    <div className="empty-icon">
                        <FileText size={24} />
                    </div>

                    <h2>Gagal memuat lamaran</h2>

                    <p>{error}</p>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={loadApplications}
                    >
                        Coba Lagi
                    </button>
                </div>
            ) : (
                <>
                    {applications.length > 0 && (
                        <section className="application-stats">
                            <div className="application-stat">
                                <div className="stat-icon">
                                    <BriefcaseBusiness
                                        size={18}
                                    />
                                </div>

                                <div>
                                    <span>
                                        Total Lamaran
                                    </span>

                                    <strong>
                                        {
                                            applications.length
                                        }
                                    </strong>
                                </div>
                            </div>

                            <div className="application-stat">
                                <div className="stat-icon">
                                    <Clock3 size={18} />
                                </div>

                                <div>
                                    <span>Draft</span>

                                    <strong>
                                        {draftCount}
                                    </strong>
                                </div>
                            </div>
                        </section>
                    )}

                    {applications.length === 0 ? (
                        <div className="applications-empty">
                            <div className="empty-icon">
                                <FileText size={24} />
                            </div>

                            <h2>
                                Belum ada lamaran
                            </h2>

                            <p>
                                Scan lowongan pertama
                                kamu dan simpan hasilnya
                                untuk melihatnya di sini.
                            </p>
                        </div>
                    ) : (
                        <section className="applications-list">
                            <div className="section-heading">
                                <div>
                                    <p className="section-eyebrow">
                                        HISTORY
                                    </p>

                                    <h2>
                                        Semua Lamaran
                                    </h2>
                                </div>
                            </div>

                            {applications.map(
                                (application) => (
                                    <div
                                        className="application-wrapper"
                                        key={
                                            application.id
                                        }
                                    >
                                        <ApplicationCard
                                            company={
                                                application.company
                                            }
                                            position={
                                                application.position
                                            }
                                            location={
                                                application.location
                                            }
                                            status={formatStatus(application.status)}
                                            date={formatDate(application.createdAt)}
                                            onClick={() =>
                                                openApplication(application)
                                            }
                                        />

                                        <div className="application-details">
                                            {application.email && (
                                                <div>
                                                    <Mail
                                                        size={
                                                            14
                                                        }
                                                    />

                                                    <span>
                                                        {
                                                            application.email
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {application.location && (
                                                <div>
                                                    <MapPin
                                                        size={
                                                            14
                                                        }
                                                    />

                                                    <span>
                                                        {
                                                            application.location
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                className="delete-application"
                                                onClick={() =>
                                                    deleteApplication(
                                                        application.id
                                                    )
                                                }
                                            >
                                                <Trash2
                                                    size={
                                                        14
                                                    }
                                                />

                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

function formatStatus(status) {
    const labels = {
        draft: "Draft",
        prepared: "Disiapkan",
        sent: "Terkirim",
        rejected: "Ditolak",
        accepted: "Diterima",
    };

    return labels[
        status?.toLowerCase()
    ] || status || "Draft";
}

function formatDate(date) {
    if (!date) return "";

    try {
        return new Intl.DateTimeFormat(
            "id-ID",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        ).format(new Date(date));
    } catch {
        return "";
    }
}

export default Applications;
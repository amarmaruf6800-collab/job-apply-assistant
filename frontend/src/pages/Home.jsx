import {
    BriefcaseBusiness,
    Clock3,
    FileText,
    Sparkles,
} from "lucide-react";

import ApplicationCard from "../components/ApplicationCard";
import ScanButton from "../components/ScanButton";

function Home({ onNavigate, onLogout, user }) {
    return (
        <div className="page home-page">
            <header className="home-header">
                <div>
                    <p className="eyebrow">JOB APPLICATION ASSISTANT</p>

                    <h1>
                        Lamar pekerjaan
                        <br />
                        <span>lebih mudah.</span>
                    </h1>
                </div>

                <button
                    className="avatar-button"
                    type="button"
                    onClick={onLogout}
                    aria-label="Keluar"
                    title={`Keluar${user?.name ? ` dari ${user.name}` : ""}`}
                >
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </button>
            </header>

            {/* HERO / SCAN */}
            <section className="welcome-card">
                <div className="welcome-content">
                    <div className="spark-icon">
                        <Sparkles size={18} />
                    </div>

                    <p className="welcome-label">READY TO APPLY?</p>

                    <h2>
                        Punya screenshot
                        <br />
                        lowongan?
                    </h2>

                    <p className="welcome-description">
                        Upload screenshot dan biarkan aplikasi membaca
                        email, subject, posisi, dan detail lowongan secara
                        otomatis.
                    </p>

                    <ScanButton
                        onClick={() => onNavigate("scan")}
                    />
                </div>

                <div className="welcome-glow" />
            </section>

            {/* STATS */}
            <section className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <BriefcaseBusiness size={18} />
                    </div>

                    <div>
                        <span>Total Lamaran</span>
                        <strong>0</strong>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Clock3 size={18} />
                    </div>

                    <div>
                        <span>Menunggu</span>
                        <strong>0</strong>
                    </div>
                </div>
            </section>

            {/* RECENT APPLICATIONS */}
            <section className="recent-section">
                <div className="section-heading">
                    <div>
                        <p className="section-eyebrow">ACTIVITY</p>
                        <h2>Lamaran terbaru</h2>
                    </div>

                    <button
                        onClick={() => onNavigate("applications")}
                    >
                        Lihat semua
                    </button>
                </div>

                {/* EMPTY STATE */}
                <div className="empty-card">
                    <div className="empty-icon">
                        <FileText size={22} />
                    </div>

                    <h3>Belum ada lamaran</h3>

                    <p>
                        Scan lowongan pertama kamu dan hasilnya akan
                        muncul di sini.
                    </p>

                    <button
                        onClick={() => onNavigate("scan")}
                    >
                        Mulai scan
                    </button>
                </div>

                {/*
          NANTI ketika sudah ada data:

          <ApplicationCard
            company="IT Service Centre"
            position="Teknisi Komputer"
            location="Jakarta"
            status="Draft"
            date="30 Sep 2026"
            onClick={() => {}}
          />
        */}
            </section>
        </div>
    );
}

export default Home;
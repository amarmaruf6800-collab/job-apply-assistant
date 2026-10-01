import { useState } from "react";
import {
    ArrowRight,
    LockKeyhole,
    Mail,
    User,
} from "lucide-react";
import { api } from "../services/api";

function Register({ onRegisterSuccess, onNavigate }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!name.trim() || !email.trim() || !password) {
            setError("Nama, email, dan password wajib diisi.");
            return;
        }

        if (password.length < 6) {
            setError("Password minimal 6 karakter.");
            return;
        }

        try {
            setLoading(true);
            await api.post("/auth/register", {
                name,
                email,
                password,
            });

            onRegisterSuccess();
        } catch (requestError) {
            console.error(requestError);
            setError(
                requestError.message ||
                    "Registrasi gagal. Silakan coba lagi."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page auth-page">
            <div className="auth-container">
                <header className="auth-header">
                    <p className="section-eyebrow">
                        JOB APPLICATION ASSISTANT
                    </p>
                    <h1>Buat akun kamu.</h1>
                    <p>
                        Simpan CV, riwayat lamaran, dan pengaturan
                        aplikasi kamu di satu tempat.
                    </p>
                </header>

                <form className="auth-card" onSubmit={handleSubmit}>
                    {error && (
                        <div className="scan-error" role="alert">
                            <strong>Registrasi gagal</strong>
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="auth-field">
                        <label htmlFor="register-name">Nama</label>
                        <div className="auth-input-wrapper">
                            <User size={17} aria-hidden="true" />
                            <input
                                id="register-name"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Nama lengkap"
                                autoComplete="name"
                                required
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="register-email">Email</label>
                        <div className="auth-input-wrapper">
                            <Mail size={17} aria-hidden="true" />
                            <input
                                id="register-email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="nama@email.com"
                                autoComplete="email"
                                required
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="register-password">Password</label>
                        <div className="auth-input-wrapper">
                            <LockKeyhole size={17} aria-hidden="true" />
                            <input
                                id="register-password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Minimal 6 karakter"
                                autoComplete="new-password"
                                minLength={6}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="primary-button auth-submit"
                        disabled={loading}
                    >
                        <ArrowRight size={18} aria-hidden="true" />
                        {loading ? "Membuat akun..." : "Buat Akun"}
                    </button>
                </form>

                <div className="auth-switch">
                    <span>Sudah punya akun?</span>
                    <button
                        type="button"
                        onClick={() => onNavigate("login")}
                    >
                        Masuk
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Register;

import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { api } from "../services/api";

function Login({ onLogin, onNavigate, notice }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Email dan password wajib diisi.");
            return;
        }

        try {
            setLoading(true);
            const result = await api.post("/auth/login", {
                email,
                password,
            });

            if (!result.token || !result.user) {
                throw new Error("Respons login dari server tidak valid.");
            }

            localStorage.setItem("token", result.token);
            onLogin(result.user);
        } catch (requestError) {
            console.error(requestError);
            setError(
                requestError.message ||
                    "Login gagal. Silakan coba lagi."
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
                    <h1>Selamat datang kembali.</h1>
                    <p>
                        Masuk untuk melanjutkan dan mengelola lamaran
                        pekerjaan kamu.
                    </p>
                </header>

                <form className="auth-card" onSubmit={handleSubmit}>
                    {notice && (
                        <div className="auth-notice" role="status">
                            {notice}
                        </div>
                    )}

                    {error && (
                        <div className="scan-error" role="alert">
                            <strong>Login gagal</strong>
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="auth-field">
                        <label htmlFor="login-email">Email</label>
                        <div className="auth-input-wrapper">
                            <Mail size={17} aria-hidden="true" />
                            <input
                                id="login-email"
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
                        <label htmlFor="login-password">Password</label>
                        <div className="auth-input-wrapper">
                            <LockKeyhole size={17} aria-hidden="true" />
                            <input
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Masukkan password"
                                autoComplete="current-password"
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
                        {loading ? "Masuk..." : "Masuk"}
                    </button>
                </form>

                <div className="auth-switch">
                    <span>Belum punya akun?</span>
                    <button
                        type="button"
                        onClick={() => onNavigate("register")}
                    >
                        Buat akun
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;

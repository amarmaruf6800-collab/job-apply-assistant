import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import Applications from "./pages/Applications";
import Documents from "./pages/Documents";
import Review from "./pages/Review";
import PrepareApplication from "./pages/PrepareApplication";

import BottomNav from "./components/BottomNav";
import { api } from "./services/api";

function App() {
  const [activePage, setActivePage] = useState(() =>
    localStorage.getItem("token") ? "home" : "login"
  );
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() =>
    Boolean(localStorage.getItem("token"))
  );
  const [loginNotice, setLoginNotice] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      return;
    }

    let cancelled = false;

    api.get("/auth/me")
      .then((result) => {
        if (!result.user) {
          throw new Error("Data sesi dari server tidak valid.");
        }

        if (!cancelled) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error("Gagal memulihkan sesi:", error);

        if (!cancelled) {
          localStorage.removeItem("token");
          setUser(null);
          setActivePage("login");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAuthLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleNavigate = (page) => {
    if (!user && page !== "login" && page !== "register") {
      setActivePage("login");
      return;
    }

    setActivePage(page);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setLoginNotice("");
    setActivePage("home");
  };

  const handleRegisterSuccess = () => {
    setLoginNotice("Akun berhasil dibuat. Silakan masuk.");
    setActivePage("login");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setLoginNotice("");
    setActivePage("login");
  };

  const renderPage = () => {
    switch (activePage) {
      case "login":
        return (
          <Login
            onLogin={handleLogin}
            onNavigate={handleNavigate}
            notice={loginNotice}
          />
        );

      case "register":
        return (
          <Register
            onRegisterSuccess={handleRegisterSuccess}
            onNavigate={handleNavigate}
          />
        );

      case "scan":
        return <Scan onNavigate={handleNavigate} />;

      case "prepare":
        return (
          <PrepareApplication
            onNavigate={handleNavigate}
          />
        );

      case "applications":
        return <Applications onNavigate={handleNavigate} />;

      case "documents":
        return <Documents />;

      case "review":
        return <Review onNavigate={handleNavigate} />;

      case "home":
      default:
        return (
          <Home
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            user={user}
          />
        );

    }
  };

  return (
    <div className="app-shell">
      <main className="app-content">
        {authLoading ? (
          <div className="auth-loading" role="status">
            <div className="auth-loading-content">
              <div className="auth-loading-spinner" aria-hidden="true" />
              <p>Memeriksa sesi...</p>
            </div>
          </div>
        ) : (
          renderPage()
        )}
      </main>

      {user && activePage !== "login" && activePage !== "register" && (
        <BottomNav
          activePage={activePage}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

export default App;
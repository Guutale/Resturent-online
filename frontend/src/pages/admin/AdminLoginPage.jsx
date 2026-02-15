import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminLoginPage = () => {
  const { login, logout } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const from = location.state?.from;
  const showDev = import.meta.env.DEV;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(email, password);
      if (data?.user?.role !== "admin") {
        logout();
        setError("This account is not an admin.");
        return;
      }
      const next = typeof from === "string" && from.startsWith("/admin") ? from : "/admin";
      nav(next, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page auth-shell">
      <form className="auth-card-modern auth-single is-active" onSubmit={onSubmit}>
        <span className="auth-icon-top"><i className="fa-solid fa-user-shield" /></span>
        <h2 className="page-title">Admin Login</h2>
        <p className="muted auth-caption">Sign in to manage orders, products, and categories.</p>
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}

        <div className="input-icon">
          <i className="fa-regular fa-envelope" />
          <input placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="input-icon">
          <i className="fa-solid fa-lock" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button className="auth-submit">Login</button>

        {showDev && (
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer", fontWeight: 900, color: "#0f172a" }}>
              Dev admin login
            </summary>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setEmail("admin@mail.com");
                  setPassword("admin123");
                }}
                style={{ justifyContent: "space-between", display: "flex", alignItems: "center", gap: 12 }}
              >
                <span style={{ fontWeight: 900 }}>Admin</span>
                <span className="muted" style={{ fontWeight: 700 }}>admin@mail.com / admin123</span>
              </button>
              <div className="muted" style={{ fontSize: 13 }}>
                If login fails, run <code>npm run seed:roles</code> inside <code>backend/</code>.
              </div>
            </div>
          </details>
        )}

        <p className="muted" style={{ marginTop: "0.9rem", marginBottom: 0 }}>
          Back to <Link className="auth-link" to="/">Home</Link>
        </p>
      </form>
    </div>
  );
};

export default AdminLoginPage;

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEV_ACCOUNTS = [
  { role: "Admin", email: "admin@mail.com", password: "admin123", hint: "Redirects to /admin" },
  { role: "HR", email: "hr@mail.com", password: "hr12345", hint: "Redirects to /hr" },
  { role: "Finance", email: "finance@mail.com", password: "finance123", hint: "Redirects to /finance" },
  { role: "Dispatcher", email: "dispatcher@mail.com", password: "dispatcher123", hint: "Redirects to /dispatcher" },
  { role: "Chef", email: "chef@mail.com", password: "chef123", hint: "Redirects to /chef" },
  { role: "Waiter", email: "waiter@mail.com", password: "waiter123", hint: "No dashboard (v1)" },
  { role: "Delivery", email: "delivery@mail.com", password: "delivery123", hint: "Redirects to /delivery" },
  { role: "User", email: "user@mail.com", password: "user123", hint: "Regular customer account" },
];

const LoginPage = () => {
  const { login } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const from = location.state?.from || "/";
  const showDev = import.meta.env.DEV;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(email, password);
      if (data?.user?.role === "admin") {
        nav("/admin", { replace: true });
      } else if (data?.user?.role === "hr") {
        nav("/hr", { replace: true });
      } else if (data?.user?.role === "finance") {
        nav("/finance", { replace: true });
      } else if (data?.user?.role === "dispatcher") {
        nav("/dispatcher", { replace: true });
      } else if (data?.user?.role === "chef") {
        nav("/chef", { replace: true });
      } else if (data?.user?.role === "delivery") {
        nav("/delivery", { replace: true });
      } else {
        nav(from, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page auth-shell">
      <form className="auth-card-modern auth-single is-active" onSubmit={onSubmit}>
        <span className="auth-icon-top"><i className="fa-solid fa-utensils" /></span>
        <h2 className="page-title">Welcome Back</h2>
        <p className="muted auth-caption">Login to continue your food ordering experience.</p>
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}

        <div className="input-icon">
          <i className="fa-regular fa-envelope" />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="input-icon">
          <i className="fa-solid fa-lock" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="auth-row">
          <label>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>
          <a className="auth-link" href="#">Forgot password?</a>
        </div>

        <button className="auth-submit">Sign In</button>

        {showDev && (
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer", fontWeight: 900, color: "#0f172a" }}>
              Dev logins (click to fill)
            </summary>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {DEV_ACCOUNTS.map((a) => (
                <button
                  key={a.role}
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(a.password);
                  }}
                  style={{ justifyContent: "space-between", display: "flex", alignItems: "center", gap: 12 }}
                  title={a.hint}
                >
                  <span style={{ fontWeight: 900 }}>{a.role}</span>
                  <span className="muted" style={{ fontWeight: 700 }}>{a.email} / {a.password}</span>
                </button>
              ))}
              <div className="muted" style={{ fontSize: 13 }}>
                If login still fails, run <code>npm run seed:roles</code> inside <code>backend/</code>.
              </div>
            </div>
          </details>
        )}

        <p className="social-label">or continue with</p>
        <div className="social-row">
          <button type="button" className="social-btn" aria-label="Google"><i className="fa-brands fa-google" /></button>
          <button type="button" className="social-btn" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></button>
          <button type="button" className="social-btn" aria-label="Apple"><i className="fa-brands fa-apple" /></button>
        </div>

        <p className="muted" style={{ marginTop: "0.9rem", marginBottom: 0 }}>
          Don&apos;t have an account? <Link className="auth-link" to="/register" state={{ from }}>Register</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;

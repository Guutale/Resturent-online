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
    <div className="page auth-page">
      <section className="auth-layout">
        <article className="panel auth-showcase">
          <p className="section-kicker">Welcome back</p>
          <h1 className="page-title">Sign in and keep the ordering flow moving.</h1>
          <p className="muted">
            Pick up where you left off, review your orders, and move from menu to payment without losing context.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <i className="fa-solid fa-box-open" />
              <div>
                <strong>Track every order</strong>
                <span>Payment updates, kitchen progress, and delivery status stay in one place.</span>
              </div>
            </div>
            <div className="auth-feature">
              <i className="fa-solid fa-bell" />
              <div>
                <strong>See notifications faster</strong>
                <span>Unread updates and payment requests remain visible after login.</span>
              </div>
            </div>
            <div className="auth-feature">
              <i className="fa-solid fa-user-check" />
              <div>
                <strong>Portal-aware redirect</strong>
                <span>Staff accounts land in the right dashboard automatically.</span>
              </div>
            </div>
          </div>

          {showDev && (
            <div className="auth-dev-panel">
              <div className="auth-dev-head">
                <strong>Dev accounts</strong>
                <span className="muted">Click one to prefill credentials</span>
              </div>
              <div className="auth-dev-grid">
                {DEV_ACCOUNTS.map((account) => (
                  <button
                    key={account.role}
                    type="button"
                    className="auth-dev-card"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                    title={account.hint}
                  >
                    <strong>{account.role}</strong>
                    <span>{account.email}</span>
                  </button>
                ))}
              </div>
              <p className="muted auth-dev-caption">
                If login still fails, run `npm run seed:roles` inside `backend/`.
              </p>
            </div>
          )}
        </article>

        <form className="panel auth-form-card" onSubmit={onSubmit}>
          <span className="auth-icon-top"><i className="fa-solid fa-utensils" /></span>
          <h2 className="page-title">Sign in</h2>
          <p className="muted auth-caption">Continue your restaurant ordering experience.</p>
          {error && <div className="form-alert error">{error}</div>}

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

          <button className="auth-submit">
            <i className="fa-solid fa-arrow-right-to-bracket" />
            Sign in
          </button>

          <p className="social-label">or continue with</p>
          <div className="social-row">
            <button type="button" className="social-btn" aria-label="Google"><i className="fa-brands fa-google" /></button>
            <button type="button" className="social-btn" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></button>
            <button type="button" className="social-btn" aria-label="Apple"><i className="fa-brands fa-apple" /></button>
          </div>

          <p className="muted auth-footer-link">
            Don&apos;t have an account? <Link className="auth-link" to="/register" state={{ from }}>Register</Link>
          </p>
        </form>
      </section>
    </div>
  );
};

export default LoginPage;

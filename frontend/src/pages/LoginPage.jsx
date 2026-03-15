import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../components/AuthSplitLayout";
import { useAuth } from "../context/AuthContext";
import { getDashboardHome } from "../lib/dashboardRoles";
import { getAuthBrandingPageMeta } from "../lib/authBranding";

const DEV_ACCOUNTS = [
  { role: "Admin", email: "admin@mail.com", password: "admin123", hint: "Redirects to /admin" },
  { role: "HR", email: "hr@mail.com", password: "hr12345", hint: "Redirects to /hr" },
  { role: "Accounting", email: "finance@mail.com", password: "finance123", hint: "Redirects to /finance" },
  { role: "Dispatcher", email: "dispatcher@mail.com", password: "dispatcher123", hint: "Redirects to /dispatcher" },
  { role: "Chef", email: "chef@mail.com", password: "chef123", hint: "Redirects to /chef" },
  { role: "Waiter", email: "waiter@mail.com", password: "waiter123", hint: "Redirects to /waiter" },
  { role: "Delivery", email: "delivery@mail.com", password: "delivery123", hint: "Redirects to /delivery" },
  { role: "User", email: "user@mail.com", password: "user123", hint: "Regular customer account" },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage = () => {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const from = location.state?.from || "/";
  const showDev = import.meta.env.DEV;

  const onSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!String(password || "").trim()) {
      setError("Password is required.");
      return;
    }

    setError("");

    try {
      const data = await login(normalizedEmail, password, remember);
      const home = getDashboardHome(data?.user?.role);
      navigate(home === "/" ? from : home, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthSplitLayout
      pageType="login"
      formEyebrow="Customer and staff access"
      formTitle="Sign in to continue"
      formCaption="A cleaner, faster gateway into ordering, notifications, and role-specific dashboards."
      formIcon="fa-solid fa-utensils"
      highlights={getAuthBrandingPageMeta("login").defaultHighlights}
    >
      <form className="auth-form-stack" onSubmit={onSubmit}>
        {error && <div className="auth-alert">{error}</div>}

        <label className="auth-control">
          <span>Email address</span>
          <div className="auth-input-shell">
            <i className="fa-regular fa-envelope" />
            <input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </label>

        <label className="auth-control">
          <span>Password</span>
          <div className="auth-input-shell">
            <i className="fa-solid fa-lock" />
            <input
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </label>

        <div className="auth-inline-row">
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Keep me signed in on this device
          </label>
          <Link className="auth-helper-link" to="/#contact">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="auth-primary-btn">
          <span>Sign in</span>
          <i className="fa-solid fa-arrow-right-to-bracket" />
        </button>

        <p className="auth-form-footnote">
          New here?{" "}
          <Link className="auth-helper-link" to="/register" state={{ from }}>
            Create an account
          </Link>
        </p>

        {showDev && (
          <details className="auth-dev-box">
            <summary>Dev accounts</summary>
            <div className="auth-dev-grid-premium">
              {DEV_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  className="auth-dev-card-premium"
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
            <p className="auth-dev-caption-premium">
              If a seeded account fails, run <code>npm run seed:roles</code> in <code>backend/</code>.
            </p>
          </details>
        )}
      </form>
    </AuthSplitLayout>
  );
};

export default LoginPage;

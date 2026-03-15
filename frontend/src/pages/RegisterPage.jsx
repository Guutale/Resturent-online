import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../components/AuthSplitLayout";
import { useAuth } from "../context/AuthContext";
import { getAuthBrandingPageMeta } from "../lib/authBranding";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+()\-\s]{7,20}$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const RegisterPage = () => {
  const { register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const from = location.state?.from || "/";

  const onSubmit = async (event) => {
    event.preventDefault();

    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim();

    if (!normalizedName) {
      setError("Full name is required.");
      return;
    }

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (normalizedPhone && !phonePattern.test(normalizedPhone)) {
      setError("Enter a valid phone number or leave it blank.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (!passwordPattern.test(password)) {
      setError("Password must be at least 8 characters and include at least one letter and one number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Confirm password must match the password.");
      return;
    }

    setError("");

    try {
      await register(normalizedName, normalizedEmail, password, normalizedPhone);
      const destination = typeof from === "string" && from !== "/" ? from : "/profile";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthSplitLayout
      pageType="register"
      formEyebrow="Guest onboarding"
      formTitle="Create your account"
      formCaption="Save your profile once, then keep future ordering and checkout noticeably smoother."
      formIcon="fa-solid fa-user-plus"
      highlights={getAuthBrandingPageMeta("register").defaultHighlights}
    >
      <form className="auth-form-stack" onSubmit={onSubmit}>
        {error && <div className="auth-alert">{error}</div>}

        <div className="auth-grid-two">
          <label className="auth-control">
            <span>Full name</span>
            <div className="auth-input-shell">
              <i className="fa-regular fa-user" />
              <input
                type="text"
                placeholder="Your full name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          </label>

          <label className="auth-control">
            <span>Phone number</span>
            <div className="auth-input-shell">
              <i className="fa-solid fa-phone" />
              <input
                type="tel"
                placeholder="Optional"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
          </label>
        </div>

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

        <div className="auth-grid-two">
          <label className="auth-control">
            <span>Password</span>
            <div className="auth-input-shell">
              <i className="fa-solid fa-lock" />
              <input
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          <label className="auth-control">
            <span>Confirm password</span>
            <div className="auth-input-shell">
              <i className="fa-solid fa-shield-halved" />
              <input
                type="password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
          </label>
        </div>

        <p className="auth-inline-note">
          Use at least 8 characters with one letter and one number.
        </p>

        <button type="submit" className="auth-primary-btn">
          <span>Create account</span>
          <i className="fa-solid fa-arrow-right" />
        </button>

        <p className="auth-form-footnote">
          Already have an account?{" "}
          <Link className="auth-helper-link" to="/login" state={{ from }}>
            Sign in
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
};

export default RegisterPage;

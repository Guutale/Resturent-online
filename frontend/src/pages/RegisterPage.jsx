import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const { register } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const from = location.state?.from || "/";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!agree) {
      setError("Please agree to terms.");
      return;
    }
    try {
      await register(name, email, password);
      nav(from, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page auth-page">
      <section className="auth-layout">
        <article className="panel auth-showcase auth-showcase-alt">
          <p className="section-kicker">Create account</p>
          <h1 className="page-title">Join once and keep every future order easier.</h1>
          <p className="muted">
            Save your profile, move through checkout faster, and keep order history and notifications connected.
          </p>

          <div className="auth-metric-grid">
            <div className="metric-card">
              <strong>2 steps</strong>
              <span>Register, then start ordering</span>
            </div>
            <div className="metric-card">
              <strong>1 account</strong>
              <span>For cart, orders, profile, and notifications</span>
            </div>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <i className="fa-solid fa-credit-card" />
              <div>
                <strong>Cleaner checkout</strong>
                <span>Delivery details and payment confirmation stay tied to your account.</span>
              </div>
            </div>
            <div className="auth-feature">
              <i className="fa-solid fa-receipt" />
              <div>
                <strong>Persistent history</strong>
                <span>Open past orders, invoices, and payment statuses from one account area.</span>
              </div>
            </div>
          </div>
        </article>

        <form className="panel auth-form-card" onSubmit={onSubmit}>
          <span className="auth-icon-top"><i className="fa-solid fa-pizza-slice" /></span>
          <h2 className="page-title">Create account</h2>
          <p className="muted auth-caption">Join and start ordering your favorite meals.</p>
          {error && <div className="form-alert error">{error}</div>}

          <div className="input-icon">
            <i className="fa-regular fa-user" />
            <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

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

          <div className="auth-row auth-row-start">
            <label>
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              I agree to terms
            </label>
          </div>

          <button className="auth-submit">
            <i className="fa-solid fa-user-plus" />
            Create account
          </button>

          <p className="social-label">or continue with</p>
          <div className="social-row">
            <button type="button" className="social-btn" aria-label="Google"><i className="fa-brands fa-google" /></button>
            <button type="button" className="social-btn" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></button>
            <button type="button" className="social-btn" aria-label="Apple"><i className="fa-brands fa-apple" /></button>
          </div>

          <p className="muted auth-footer-link">
            Already have an account? <Link className="auth-link" to="/login" state={{ from }}>Sign in</Link>
          </p>
        </form>
      </section>
    </div>
  );
};

export default RegisterPage;

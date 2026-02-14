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
    <div className="page auth-shell">
      <form className="auth-card-modern auth-single is-active" onSubmit={onSubmit}>
        <span className="auth-icon-top"><i className="fa-solid fa-pizza-slice" /></span>
        <h2 className="page-title">Create Account</h2>
        <p className="muted auth-caption">Join and start ordering your favorite meals.</p>
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}

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

        <div className="auth-row" style={{ justifyContent: "flex-start" }}>
          <label>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            I agree to terms
          </label>
        </div>

        <button className="auth-submit">Create Account</button>

        <p className="social-label">or continue with</p>
        <div className="social-row">
          <button type="button" className="social-btn" aria-label="Google"><i className="fa-brands fa-google" /></button>
          <button type="button" className="social-btn" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></button>
          <button type="button" className="social-btn" aria-label="Apple"><i className="fa-brands fa-apple" /></button>
        </div>

        <p className="muted" style={{ marginTop: "0.9rem", marginBottom: 0 }}>
          Already have an account? <Link className="auth-link" to="/login" state={{ from }}>Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const from = location.state?.from || "/";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(email, password);
      if (data?.user?.role === "admin") {
        nav("/admin", { replace: true });
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

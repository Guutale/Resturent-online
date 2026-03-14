import React, { useState } from "react";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [message, setMessage] = useState("");
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNext, setPwdNext] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "GU";

  const save = async (e) => {
    e.preventDefault();
    const data = await apiRequest("/users/me", {
      method: "PATCH",
      body: JSON.stringify({ name, phone }),
    });
    setUser(data.user);
    setMessage("Profile updated.");
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    setPwdErr("");
    try {
      const data = await apiRequest("/users/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: pwdCurrent, newPassword: pwdNext }),
      });
      setPwdCurrent("");
      setPwdNext("");
      setPwdMsg(data.message || "Password updated.");
    } catch (err) {
      setPwdErr(err.message);
    }
  };

  return (
    <div className="page account-page">
      <section className="panel account-hero">
        <div className="account-hero-main">
          <span className="account-avatar-xl">{userInitials}</span>
          <div>
            <p className="section-kicker">Profile</p>
            <h1 className="page-title">{user?.name || "Guest account"}</h1>
            <p className="muted">
              Keep your delivery contact details current so checkout and notifications stay accurate.
            </p>
          </div>
        </div>

        <div className="account-hero-stats">
          <div className="detail-meta-card">
            <span className="detail-meta-label">Email</span>
            <strong>{user?.email || "Not available"}</strong>
          </div>
          <div className="detail-meta-card">
            <span className="detail-meta-label">Role</span>
            <strong>{user?.role || "user"}</strong>
          </div>
          <div className="detail-meta-card">
            <span className="detail-meta-label">Phone</span>
            <strong>{user?.phone || "Add your phone"}</strong>
          </div>
        </div>
      </section>

      <section className="account-grid">
        <form className="panel profile-form-card" onSubmit={save}>
          <div className="summary-card-head">
            <p className="section-kicker">Details</p>
            <h2 className="page-title">Contact information</h2>
          </div>

          {message && <div className="form-alert success">{message}</div>}

          <label className="field-block">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          </label>

          <label className="field-block">
            <span>Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
          </label>

          <button type="submit">
            <i className="fa-solid fa-floppy-disk" />
            Save profile
          </button>
        </form>

        <form className="panel profile-form-card" onSubmit={changePassword}>
          <div className="summary-card-head">
            <p className="section-kicker">Security</p>
            <h2 className="page-title">Change password</h2>
          </div>

          {pwdMsg && <div className="form-alert success">{pwdMsg}</div>}
          {pwdErr && <div className="form-alert error">{pwdErr}</div>}

          <label className="field-block">
            <span>Current password</span>
            <input
              type="password"
              value={pwdCurrent}
              onChange={(e) => setPwdCurrent(e.target.value)}
              placeholder="Current password"
            />
          </label>

          <label className="field-block">
            <span>New password</span>
            <input
              type="password"
              value={pwdNext}
              onChange={(e) => setPwdNext(e.target.value)}
              placeholder="New password"
            />
          </label>

          <button type="submit">
            <i className="fa-solid fa-key" />
            Update password
          </button>
        </form>
      </section>
    </div>
  );
};

export default ProfilePage;

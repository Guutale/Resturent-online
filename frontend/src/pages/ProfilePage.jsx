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
    <div className="page">
      <form className="panel auth-single" onSubmit={save}>
        <h2 className="page-title"><i className="fa-regular fa-user" /> Profile</h2>
        {message && <p style={{ color: "#166534" }}>{message}</p>}
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
        <button>Save</button>
      </form>

      <form className="panel auth-single" onSubmit={changePassword} style={{ marginTop: "1rem" }}>
        <h2 className="page-title"><i className="fa-solid fa-key" /> Change Password</h2>
        {pwdMsg && <p style={{ color: "#166534" }}>{pwdMsg}</p>}
        {pwdErr && <p style={{ color: "#dc2626" }}>{pwdErr}</p>}
        <input
          type="password"
          value={pwdCurrent}
          onChange={(e) => setPwdCurrent(e.target.value)}
          placeholder="Current password"
        />
        <input
          type="password"
          value={pwdNext}
          onChange={(e) => setPwdNext(e.target.value)}
          placeholder="New password"
        />
        <button>Update Password</button>
      </form>
    </div>
  );
};

export default ProfilePage;

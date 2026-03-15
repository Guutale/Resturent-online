import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { getDashboardRoleLabel } from "../../lib/dashboardRoles";

const DashboardSettingsPage = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setProfile({
      name: user?.name || "",
      phone: user?.phone || "",
    });
  }, [user?.name, user?.phone]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSavingProfile(true);

    try {
      const response = await apiRequest("/users/me", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
      setUser({ ...user, ...response.user });
      setMessage("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSavingPassword(true);

    try {
      await apiRequest("/users/me/password", {
        method: "PATCH",
        body: JSON.stringify(passwords),
      });
      setPasswords({ currentPassword: "", newPassword: "" });
      setMessage("Password updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Profile Settings</h1>
          <p className="admin-subtitle">Update your profile and password for the {getDashboardRoleLabel(user?.role)} dashboard.</p>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}
      {message && <div className="admin-alert dashboard-success-alert">{message}</div>}

      <div className="admin-two-col">
        <section className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Profile</h3>
            <p className="admin-surface-subtitle">Basic account details shown in the dashboard.</p>
          </div>

          <form className="admin-form" onSubmit={saveProfile}>
            <div>
              <label className="admin-label">Full Name</label>
              <input
                className="admin-input"
                value={profile.name}
                onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
              />
            </div>

            <div className="admin-form-2col">
              <div>
                <label className="admin-label">Email</label>
                <input className="admin-input" value={user?.email || ""} disabled />
              </div>
              <div>
                <label className="admin-label">Phone</label>
                <input
                  className="admin-input"
                  value={profile.phone}
                  onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
                />
              </div>
            </div>

            <div className="admin-form-2col">
              <div>
                <label className="admin-label">Role</label>
                <input className="admin-input" value={getDashboardRoleLabel(user?.role)} disabled />
              </div>
              <div>
                <label className="admin-label">User ID</label>
                <input className="admin-input" value={user?._id || ""} disabled />
              </div>
            </div>

            <div className="admin-modal-actions" style={{ justifyContent: "flex-start" }}>
              <button type="submit" className="admin-btn-primary" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Password</h3>
            <p className="admin-surface-subtitle">Use a stronger password for this account.</p>
          </div>

          <form className="admin-form" onSubmit={updatePassword}>
            <div>
              <label className="admin-label">Current Password</label>
              <input
                className="admin-input"
                type="password"
                value={passwords.currentPassword}
                onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
              />
            </div>

            <div>
              <label className="admin-label">New Password</label>
              <input
                className="admin-input"
                type="password"
                value={passwords.newPassword}
                onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
              />
            </div>

            <div className="admin-modal-actions" style={{ justifyContent: "flex-start" }}>
              <button type="submit" className="admin-btn-primary" disabled={savingPassword}>
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default DashboardSettingsPage;

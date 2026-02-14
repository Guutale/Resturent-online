import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const roleBadge = (role) => `badge role-${role || "user"}`;

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState(""); // "" | "active" | "blocked"
  const [error, setError] = useState("");

  const load = () => {
    const params = new URLSearchParams();
    params.set("limit", "50");
    if (search.trim()) params.set("search", search.trim());
    if (role) params.set("role", role);
    if (status === "active") params.set("isBlocked", "false");
    if (status === "blocked") params.set("isBlocked", "true");

    return apiRequest(`/users?${params.toString()}`)
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    const t = setTimeout(() => load(), 200);
    return () => clearTimeout(t);
  }, [search, role, status]);

  const counts = useMemo(() => {
    const total = items.length;
    const admins = items.filter((u) => u.role === "admin").length;
    const delivery = items.filter((u) => u.role === "delivery").length;
    const blocked = items.filter((u) => u.isBlocked).length;
    return { total, admins, delivery, blocked };
  }, [items]);

  const updateUser = async (id, payload) => {
    setError("");
    try {
      await apiRequest(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const del = async (u) => {
    setError("");
    const ok = window.confirm(`Delete user "${u.name}" (${u.email})?`);
    if (!ok) return;
    try {
      await apiRequest(`/users/${u._id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Users</h1>
          <p className="admin-subtitle">Search, block/unblock, and assign roles.</p>
        </div>
        <div className="admin-actions">
          <div className="admin-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              className="admin-input"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="admin-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="delivery">Delivery</option>
          </select>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card animate-fade-in delay-100">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-users" /></div>
            <div>
              <div className="admin-stat-number">{counts.total}</div>
              <div className="admin-stat-label">Loaded Users</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-200">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-user-shield" /></div>
            <div>
              <div className="admin-stat-number">{counts.admins}</div>
              <div className="admin-stat-label">Admins</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-300">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-motorcycle" /></div>
            <div>
              <div className="admin-stat-number">{counts.delivery}</div>
              <div className="admin-stat-label">Delivery</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-400">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-ban" /></div>
            <div>
              <div className="admin-stat-number">{counts.blocked}</div>
              <div className="admin-stat-label">Blocked</div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-surface">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ width: 260 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => {
                const isSelf = String(currentUser?._id || "") === String(u._id || "");
                return (
                <tr key={u._id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-avatar" aria-hidden="true">
                        {(u.name || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 950 }}>{u.name}</div>
                        <div className="admin-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="admin-select"
                      value={u.role}
                      onChange={(e) => updateUser(u._id, { role: e.target.value })}
                      disabled={isSelf}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="delivery">Delivery</option>
                    </select>
                    <div style={{ marginTop: 8 }}>
                      <span className={roleBadge(u.role)}>{u.role}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-status-cell">
                      <button
                        type="button"
                        className={`admin-switch${u.isBlocked ? "" : " checked"}`}
                        onClick={() => updateUser(u._id, { isBlocked: !u.isBlocked })}
                        aria-pressed={!u.isBlocked}
                        aria-label={u.isBlocked ? "Unblock user" : "Block user"}
                        title={u.isBlocked ? "Unblock" : "Block"}
                        disabled={isSelf}
                      >
                        <span className="admin-switch-thumb" />
                      </button>
                      <span className={`badge ${u.isBlocked ? "cancelled" : "delivered"}`}>
                        {u.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <Link className="admin-btn-link" to={`/admin/users/${u._id}`}>
                        <i className="fa-solid fa-receipt" /> Orders
                      </Link>
                      <button
                        type="button"
                        className="admin-icon-btn danger"
                        onClick={() => del(u)}
                        aria-label="Delete"
                        disabled={isSelf}
                        title={isSelf ? "You cannot delete your own account" : "Delete"}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-empty-cell">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;

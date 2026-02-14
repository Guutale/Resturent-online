import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const roleBadge = (role) => `badge role-${role || "user"}`;

const isStaffRole = (role) => role === "chef" || role === "waiter" || role === "delivery" || role === "dispatcher";

const emptyForm = {
  role: "chef",
  name: "",
  email: "",
  password: "",
  phone: "",
  nationalId: "",
  address: "",
  experience: "",
  monthlySalary: "",
  salaryPayDay: "",
  startDate: "",
  vehicleType: "",
  availabilityStatus: "offline",
};

const AdminStaffPage = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("chef");
  const [status, setStatus] = useState(""); // "" | "active" | "blocked"
  const [error, setError] = useState("");

  const [modal, setModal] = useState({ open: false, mode: "create", user: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (search.trim()) params.set("search", search.trim());
    if (role && role !== "all") params.set("role", role);
    if (status === "active") params.set("isBlocked", "false");
    if (status === "blocked") params.set("isBlocked", "true");

    return apiRequest(`/users?${params.toString()}`)
      .then((d) => {
        const raw = d.items || [];
        const filtered = role === "all" ? raw.filter((u) => isStaffRole(u.role)) : raw;
        setItems(filtered);
      })
      .catch(() => setItems([]));
  };

  useEffect(() => {
    const t = setTimeout(() => load(), 200);
    return () => clearTimeout(t);
  }, [search, role, status]);

  const counts = useMemo(() => {
    const total = items.length;
    const chefs = items.filter((u) => u.role === "chef").length;
    const waiters = items.filter((u) => u.role === "waiter").length;
    const delivery = items.filter((u) => u.role === "delivery").length;
    const dispatchers = items.filter((u) => u.role === "dispatcher").length;
    const blocked = items.filter((u) => u.isBlocked).length;
    return { total, chefs, waiters, delivery, dispatchers, blocked };
  }, [items]);

  const openCreate = () => {
    setError("");
    setForm({ ...emptyForm, role: role !== "all" ? role : "chef" });
    setModal({ open: true, mode: "create", user: null });
  };

  const openEdit = (u) => {
    setError("");
    setForm({
      role: u.role || "chef",
      name: u.name || "",
      email: u.email || "",
      password: "",
      phone: u.phone || "",
      nationalId: u.staff?.nationalId || "",
      address: u.staff?.address || "",
      experience: u.staff?.experience || "",
      monthlySalary: u.staff?.monthlySalary ?? "",
      salaryPayDay: u.staff?.salaryPayDay ?? "",
      startDate: u.staff?.startDate ? String(u.staff.startDate).slice(0, 10) : "",
      vehicleType: u.staff?.vehicleType || "",
      availabilityStatus: u.staff?.availabilityStatus || "offline",
    });
    setModal({ open: true, mode: "edit", user: u });
  };

  const closeModal = () => setModal({ open: false, mode: "create", user: null });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        role: form.role,
        name: form.name,
        email: form.email,
        phone: form.phone,
        staff: {
          nationalId: form.nationalId || undefined,
          address: form.address || undefined,
          experience: form.experience || undefined,
          monthlySalary: form.monthlySalary === "" ? undefined : Number(form.monthlySalary),
          salaryPayDay: form.salaryPayDay === "" ? undefined : Number(form.salaryPayDay),
          startDate: form.startDate || undefined,
          vehicleType: form.vehicleType || undefined,
          availabilityStatus: form.availabilityStatus || undefined,
        },
      };

      if (modal.mode === "create") {
        payload.password = form.password;
        await apiRequest("/users", { method: "POST", body: JSON.stringify(payload) });
      } else {
        await apiRequest(`/users/${modal.user._id}`, { method: "PATCH", body: JSON.stringify(payload) });
      }

      closeModal();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleBlocked = async (u) => {
    setError("");
    try {
      await apiRequest(`/users/${u._id}`, { method: "PATCH", body: JSON.stringify({ isBlocked: !u.isBlocked }) });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const del = async (u) => {
    setError("");
    const ok = window.confirm(`Delete staff "${u.name}" (${u.email})?`);
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
          <h1 className="admin-title">Staff</h1>
          <p className="admin-subtitle">Manage Chef, Waiter, Delivery, and Dispatcher accounts.</p>
        </div>
        <div className="admin-actions">
          <div className="admin-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              className="admin-input"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="admin-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="chef">Chefs</option>
            <option value="waiter">Waiters</option>
            <option value="delivery">Delivery</option>
            <option value="dispatcher">Dispatchers</option>
            <option value="all">All staff</option>
          </select>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="blocked">Inactive</option>
          </select>
          <button type="button" className="admin-btn-primary" onClick={openCreate}>
            <i className="fa-solid fa-plus" /> Add Staff
          </button>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card animate-fade-in delay-100">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-user-group" /></div>
            <div>
              <div className="admin-stat-number">{counts.total}</div>
              <div className="admin-stat-label">Loaded Staff</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-200">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-kitchen-set" /></div>
            <div>
              <div className="admin-stat-number">{counts.chefs}</div>
              <div className="admin-stat-label">Chefs</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-300">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-bell-concierge" /></div>
            <div>
              <div className="admin-stat-number">{counts.waiters}</div>
              <div className="admin-stat-label">Waiters</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-400">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-ban" /></div>
            <div>
              <div className="admin-stat-number">{counts.blocked}</div>
              <div className="admin-stat-label">Inactive</div>
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
                <th>Staff</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th style={{ width: 320 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-avatar" aria-hidden="true">
                        {(u.name || "S").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 950 }}>{u.name}</div>
                        <div className="admin-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={roleBadge(u.role)}>{u.role}</span>
                  </td>
                  <td>{u.phone || <span className="admin-muted">-</span>}</td>
                  <td>
                    <div className="admin-status-cell">
                      <button
                        type="button"
                        className={`admin-switch${u.isBlocked ? "" : " checked"}`}
                        onClick={() => toggleBlocked(u)}
                        aria-pressed={!u.isBlocked}
                        aria-label={u.isBlocked ? "Activate staff" : "Deactivate staff"}
                        title={u.isBlocked ? "Activate" : "Deactivate"}
                      >
                        <span className="admin-switch-thumb" />
                      </button>
                      <span className={`badge ${u.isBlocked ? "cancelled" : "delivered"}`}>
                        {u.isBlocked ? "Inactive" : "Active"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="admin-icon-btn" onClick={() => openEdit(u)} title="Edit">
                        <i className="fa-solid fa-pen" />
                      </button>
                      <Link className="admin-btn-link" to={`/admin/users/${u._id}`}>
                        <i className="fa-solid fa-receipt" /> Orders
                      </Link>
                      <button type="button" className="admin-icon-btn danger" onClick={() => del(u)} title="Delete">
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty-cell">No staff found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-head">
              <h3 className="admin-modal-title">
                {modal.mode === "create" ? "Add Staff" : "Edit Staff"}
              </h3>
              <div className="admin-muted">
                {modal.mode === "create" ? "Create a staff login (role-based access)." : "Update staff profile fields."}
              </div>
            </div>

            <form className="admin-form" onSubmit={submit}>
              <div className="admin-form-2col">
                <div>
                  <label className="admin-label">Role</label>
                  <select className="admin-select" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                    <option value="chef">Chef</option>
                    <option value="waiter">Waiter</option>
                    <option value="delivery">Delivery</option>
                    <option value="dispatcher">Dispatcher</option>
                  </select>
                </div>
                <div>
                  <label className="admin-label">Phone</label>
                  <input className="admin-input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="0612345678" />
                </div>
              </div>

              <div className="admin-form-2col">
                <div>
                  <label className="admin-label">Full Name</label>
                  <input className="admin-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ahmed Ali" />
                </div>
                <div>
                  <label className="admin-label">Email</label>
                  <input className="admin-input" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="ahmed@mail.com" />
                </div>
              </div>

              {modal.mode === "create" && (
                <div>
                  <label className="admin-label">Password</label>
                  <input className="admin-input" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Minimum 6 characters" />
                </div>
              )}

              {(form.role === "chef" || form.role === "waiter") && (
                <>
                  <div className="admin-form-2col">
                    <div>
                      <label className="admin-label">National ID (optional)</label>
                      <input className="admin-input" value={form.nationalId} onChange={(e) => setForm((p) => ({ ...p, nationalId: e.target.value }))} placeholder="ID number" />
                    </div>
                    <div>
                      <label className="admin-label">Experience</label>
                      <input className="admin-input" value={form.experience} onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))} placeholder="3 years" />
                    </div>
                  </div>

                  <div>
                    <label className="admin-label">Address</label>
                    <input className="admin-input" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Hodan, Mogadishu..." />
                  </div>

                  <div className="admin-form-2col">
                    <div>
                      <label className="admin-label">Monthly Salary</label>
                      <input className="admin-input" type="number" value={form.monthlySalary} onChange={(e) => setForm((p) => ({ ...p, monthlySalary: e.target.value }))} placeholder="400" />
                    </div>
                    <div>
                      <label className="admin-label">Salary Pay Day (1-31)</label>
                      <input className="admin-input" type="number" value={form.salaryPayDay} onChange={(e) => setForm((p) => ({ ...p, salaryPayDay: e.target.value }))} placeholder="25" />
                    </div>
                  </div>

                  <div>
                    <label className="admin-label">Start Date</label>
                    <input className="admin-input" type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
                  </div>
                </>
              )}

              {form.role === "delivery" && (
                <>
                  <div className="admin-form-2col">
                    <div>
                      <label className="admin-label">Vehicle Type (optional)</label>
                      <input className="admin-input" value={form.vehicleType} onChange={(e) => setForm((p) => ({ ...p, vehicleType: e.target.value }))} placeholder="Motorbike" />
                    </div>
                    <div>
                      <label className="admin-label">Availability</label>
                      <select className="admin-select" value={form.availabilityStatus} onChange={(e) => setForm((p) => ({ ...p, availabilityStatus: e.target.value }))}>
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaffPage;


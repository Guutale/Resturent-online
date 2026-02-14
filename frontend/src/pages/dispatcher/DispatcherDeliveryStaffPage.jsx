import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const availabilityBadge = (v) => {
  if (v === "available") return "badge delivered";
  if (v === "busy") return "badge preparing";
  return "badge cancelled";
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  vehicleType: "",
  availabilityStatus: "offline",
};

const DispatcherDeliveryStaffPage = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [perfModal, setPerfModal] = useState({ open: false, user: null, data: null, loading: false });

  const load = () => {
    const params = new URLSearchParams();
    params.set("limit", "200");
    if (search.trim()) params.set("search", search.trim());
    if (availability) params.set("availabilityStatus", availability);
    if (status === "active") params.set("isBlocked", "false");
    if (status === "blocked") params.set("isBlocked", "true");
    return apiRequest(`/delivery-staff?${params.toString()}`)
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    const t = setTimeout(() => load(), 200);
    return () => clearTimeout(t);
  }, [search, availability, status]);

  const openCreate = () => {
    setError("");
    setForm(emptyForm);
    setModalOpen(true);
  };

  const closeCreate = () => setModalOpen(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiRequest("/delivery-staff", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          staff: {
            vehicleType: form.vehicleType || undefined,
            availabilityStatus: form.availabilityStatus,
          },
        }),
      });
      closeCreate();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id, payload) => {
    setError("");
    try {
      await apiRequest(`/delivery-staff/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openPerformance = async (u) => {
    setPerfModal({ open: true, user: u, data: null, loading: true });
    try {
      const d = await apiRequest(`/delivery-staff/${u._id}/performance`);
      setPerfModal({ open: true, user: u, data: d.performance, loading: false });
    } catch (err) {
      setPerfModal({ open: true, user: u, data: null, loading: false });
      setError(err.message);
    }
  };

  const closePerformance = () => setPerfModal({ open: false, user: null, data: null, loading: false });

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Delivery Staff</h1>
          <p className="admin-subtitle">Create delivery accounts and manage availability status.</p>
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
          <select className="admin-select" value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="">All availability</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="blocked">Inactive</option>
          </select>
          <button type="button" className="admin-btn-primary" onClick={openCreate}>
            <i className="fa-solid fa-plus" /> Add Delivery
          </button>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-surface">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Phone</th>
                <th>Vehicle</th>
                <th>Availability</th>
                <th>Status</th>
                <th style={{ width: 260 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ fontWeight: 950 }}>{u.name}</div>
                    <div className="admin-muted">{u.email}</div>
                  </td>
                  <td>{u.phone || <span className="admin-muted">-</span>}</td>
                  <td className="admin-muted">{u.staff?.vehicleType || "-"}</td>
                  <td>
                    <select
                      className="admin-select"
                      value={u.staff?.availabilityStatus || "offline"}
                      onChange={(e) => patch(u._id, { staff: { availabilityStatus: e.target.value } })}
                    >
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="offline">Offline</option>
                    </select>
                    <div style={{ marginTop: 8 }}>
                      <span className={availabilityBadge(u.staff?.availabilityStatus || "offline")}>
                        {u.staff?.availabilityStatus || "offline"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-status-cell">
                      <button
                        type="button"
                        className={`admin-switch${u.isBlocked ? "" : " checked"}`}
                        onClick={() => patch(u._id, { isBlocked: !u.isBlocked })}
                        aria-pressed={!u.isBlocked}
                        aria-label={u.isBlocked ? "Activate" : "Deactivate"}
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
                      <button type="button" className="admin-btn-secondary" onClick={() => openPerformance(u)}>
                        Performance
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-empty-cell">No delivery staff found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div className="admin-modal-head">
              <h3 className="admin-modal-title">Add Delivery Staff</h3>
              <div className="admin-muted">Creates a delivery login (role: delivery).</div>
            </div>

            <form className="admin-form" onSubmit={submit}>
              <div>
                <label className="admin-label">Full Name</label>
                <input className="admin-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="admin-form-2col">
                <div>
                  <label className="admin-label">Email</label>
                  <input className="admin-input" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="admin-label">Phone</label>
                  <input className="admin-input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="admin-label">Password</label>
                <input className="admin-input" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="admin-form-2col">
                <div>
                  <label className="admin-label">Vehicle Type (optional)</label>
                  <input className="admin-input" value={form.vehicleType} onChange={(e) => setForm((p) => ({ ...p, vehicleType: e.target.value }))} />
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

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-secondary" onClick={closeCreate} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {perfModal.open && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div className="admin-modal-head">
              <h3 className="admin-modal-title">Performance</h3>
              <div className="admin-muted">{perfModal.user?.name}</div>
            </div>
            {perfModal.loading && <div className="admin-muted">Loading...</div>}
            {!perfModal.loading && perfModal.data && (
              <div className="admin-kv">
                <div>
                  <div className="admin-muted">Completed</div>
                  <div className="admin-kv-strong">{perfModal.data.completedDeliveries}</div>
                </div>
                <div>
                  <div className="admin-muted">Cancelled/Failed</div>
                  <div className="admin-kv-strong">{perfModal.data.cancelledDeliveries}</div>
                </div>
                <div>
                  <div className="admin-muted">Avg Minutes</div>
                  <div className="admin-kv-strong">{perfModal.data.avgDeliveryMinutes}</div>
                </div>
              </div>
            )}
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn-secondary" onClick={closePerformance}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatcherDeliveryStaffPage;


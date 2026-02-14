import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

const statusBadge = (status) => `badge ${status === "paid" ? "pay-paid" : "pay-unpaid"}`;
const roleBadge = (role) => `badge role-${role || "user"}`;

const isPayrollRole = (role) => role === "chef" || role === "waiter" || role === "delivery" || role === "dispatcher";

const emptyForm = {
  staffId: "",
  month: "",
  amount: "",
  status: "paid",
  paidAt: "",
  method: "cash",
  note: "",
};

const AdminPayrollPage = () => {
  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [month, setMonth] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (month) params.set("month", month);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    return apiRequest(`/payroll/payments?${params.toString()}`)
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, [month, role, status]);

  useEffect(() => {
    apiRequest("/users?limit=200")
      .then((d) => setStaff((d.items || []).filter((u) => isPayrollRole(u.role))))
      .catch(() => setStaff([]));
  }, []);

  const totals = useMemo(() => {
    const total = items.reduce((s, x) => s + Number(x.amount || 0), 0);
    const paid = items.filter((x) => x.status === "paid").reduce((s, x) => s + Number(x.amount || 0), 0);
    const unpaid = items.filter((x) => x.status === "unpaid").reduce((s, x) => s + Number(x.amount || 0), 0);
    return { total, paid, unpaid };
  }, [items]);

  const openModal = () => {
    setError("");
    setForm({ ...emptyForm, month: month || "" });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        staffId: form.staffId,
        month: form.month,
        amount: Number(form.amount),
        status: form.status,
        paidAt: form.status === "paid" ? (form.paidAt || undefined) : undefined,
        method: form.status === "paid" ? form.method : undefined,
        note: form.note || undefined,
      };

      await apiRequest("/payroll/payments", { method: "POST", body: JSON.stringify(payload) });
      closeModal();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePaid = async (p) => {
    setError("");
    try {
      const nextStatus = p.status === "paid" ? "unpaid" : "paid";
      await apiRequest(`/payroll/payments/${p._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Payroll</h1>
          <p className="admin-subtitle">Record staff salary payments and generate monthly reports.</p>
        </div>
        <div className="admin-actions">
          <input className="admin-input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <select className="admin-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="chef">Chef</option>
            <option value="waiter">Waiter</option>
            <option value="delivery">Delivery</option>
            <option value="dispatcher">Dispatcher</option>
          </select>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <button type="button" className="admin-btn-primary" onClick={openModal}>
            <i className="fa-solid fa-plus" /> Record Payment
          </button>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card animate-fade-in delay-100">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-money-bill-wave" /></div>
            <div>
              <div className="admin-stat-number">${totals.total.toFixed(2)}</div>
              <div className="admin-stat-label">Loaded Total</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-200">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-circle-check" /></div>
            <div>
              <div className="admin-stat-number">${totals.paid.toFixed(2)}</div>
              <div className="admin-stat-label">Paid</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-300">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-circle-xmark" /></div>
            <div>
              <div className="admin-stat-number">${totals.unpaid.toFixed(2)}</div>
              <div className="admin-stat-label">Unpaid</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-400">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-receipt" /></div>
            <div>
              <div className="admin-stat-number">{items.length}</div>
              <div className="admin-stat-label">Records</div>
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
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid At</th>
                <th>Method</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div style={{ fontWeight: 950 }}>{p.staffId?.name || "-"}</div>
                    <div className="admin-muted">
                      <span className={roleBadge(p.role)}>{p.role}</span>
                      <span style={{ marginLeft: 8 }}>{p.staffId?.email || ""}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 900 }}>{p.month}</td>
                  <td>${Number(p.amount || 0).toFixed(2)}</td>
                  <td><span className={statusBadge(p.status)}>{p.status}</span></td>
                  <td className="admin-muted">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}</td>
                  <td className="admin-muted">{p.method || "-"}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="admin-btn-secondary" onClick={() => togglePaid(p)}>
                        {p.status === "paid" ? "Mark Unpaid" : "Mark Paid"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-empty-cell">No salary payments found.</td>
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
              <h3 className="admin-modal-title">Record Salary Payment</h3>
              <div className="admin-muted">Create a payroll record for a staff member.</div>
            </div>

            <form className="admin-form" onSubmit={submit}>
              <div>
                <label className="admin-label">Staff</label>
                <select className="admin-select" value={form.staffId} onChange={(e) => setForm((p) => ({ ...p, staffId: e.target.value }))}>
                  <option value="">Select staff...</option>
                  {staff.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-2col">
                <div>
                  <label className="admin-label">Month</label>
                  <input className="admin-input" type="month" value={form.month} onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))} />
                </div>
                <div>
                  <label className="admin-label">Amount</label>
                  <input className="admin-input" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="400" />
                </div>
              </div>

              <div className="admin-form-2col">
                <div>
                  <label className="admin-label">Status</label>
                  <select className="admin-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                {form.status === "paid" && (
                  <div>
                    <label className="admin-label">Method</label>
                    <select className="admin-select" value={form.method} onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}>
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                )}
              </div>

              {form.status === "paid" && (
                <div>
                  <label className="admin-label">Paid At (optional)</label>
                  <input className="admin-input" type="date" value={form.paidAt} onChange={(e) => setForm((p) => ({ ...p, paidAt: e.target.value }))} />
                </div>
              )}

              <div>
                <label className="admin-label">Note (optional)</label>
                <input className="admin-input" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Any notes..." />
              </div>

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

export default AdminPayrollPage;


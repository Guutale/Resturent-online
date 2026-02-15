import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const HRSalaryStructuresPage = () => {
  const [staff, setStaff] = useState([]);
  const [staffId, setStaffId] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [salaryPayDay, setSalaryPayDay] = useState("");
  const [allowances, setAllowances] = useState("");
  const [deductions, setDeductions] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    apiRequest("/staff?limit=500")
      .then((d) => setStaff((d.items || []).filter((u) => u.role === "chef" || u.role === "waiter" || u.role === "delivery")))
      .catch(() => setStaff([]));
  }, []);

  const load = () => {
    if (!staffId) {
      setItems([]);
      return Promise.resolve();
    }
    const params = new URLSearchParams();
    params.set("staffUserId", staffId);
    params.set("limit", "50");
    return apiRequest(`/salary-structures?${params.toString()}`)
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, [staffId]);

  const create = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await apiRequest("/salary-structures", {
        method: "POST",
        body: JSON.stringify({
          staffUserId: staffId,
          baseSalary: Number(baseSalary),
          salaryPayDay: Number(salaryPayDay),
          allowances: allowances === "" ? 0 : Number(allowances),
          deductions: deductions === "" ? 0 : Number(deductions),
          effectiveFrom,
        }),
      });
      setMsg("Salary structure saved.");
      setBaseSalary("");
      setSalaryPayDay("");
      setAllowances("");
      setDeductions("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Salary Structure</h1>
          <p className="admin-subtitle">HR sets base salary, pay day, allowances and deductions.</p>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}
      {msg && <div className="admin-alert" style={{ borderLeftColor: "#16a34a", color: "#166534" }}>{msg}</div>}

      <div className="admin-two-col">
        <div className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Set Structure</h3>
            <p className="admin-surface-subtitle">Creates a new structure (history is kept).</p>
          </div>

          <form className="admin-form" onSubmit={create}>
            <div>
              <label className="admin-label">Staff</label>
              <select className="admin-select" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
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
                <label className="admin-label">Base Salary</label>
                <input className="admin-input" type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} placeholder="400" />
              </div>
              <div>
                <label className="admin-label">Salary Pay Day (1-31)</label>
                <input className="admin-input" type="number" value={salaryPayDay} onChange={(e) => setSalaryPayDay(e.target.value)} placeholder="25" />
              </div>
            </div>

            <div className="admin-form-2col">
              <div>
                <label className="admin-label">Allowances (optional)</label>
                <input className="admin-input" type="number" value={allowances} onChange={(e) => setAllowances(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="admin-label">Deductions (optional)</label>
                <input className="admin-input" type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} placeholder="0" />
              </div>
            </div>

            <div>
              <label className="admin-label">Effective From</label>
              <input className="admin-input" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            </div>

            <div className="admin-modal-actions" style={{ justifyContent: "flex-start" }}>
              <button type="submit" className="admin-btn-primary" disabled={!staffId}>
                Save
              </button>
            </div>
          </form>
        </div>

        <div className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">History</h3>
            <p className="admin-surface-subtitle">Latest 50 structures for selected staff.</p>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-table-striped">
              <thead>
                <tr>
                  <th>Effective</th>
                  <th>Base</th>
                  <th>Pay Day</th>
                  <th>Allow</th>
                  <th>Deduct</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x._id}>
                    <td style={{ fontWeight: 900 }}>{new Date(x.effectiveFrom).toLocaleDateString()}</td>
                    <td>${Number(x.baseSalary || 0).toFixed(2)}</td>
                    <td className="admin-muted">{x.salaryPayDay}</td>
                    <td className="admin-muted">${Number(x.allowances || 0).toFixed(2)}</td>
                    <td className="admin-muted">${Number(x.deductions || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="admin-empty-cell">
                      {staffId ? "No salary structures." : "Select a staff member."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRSalaryStructuresPage;


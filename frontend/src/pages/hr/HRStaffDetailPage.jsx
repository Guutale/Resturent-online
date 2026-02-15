import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const badge = (cls) => `badge ${cls}`;

const HRStaffDetailPage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const u = await apiRequest(`/staff/${id}`);
      setUser(u.user);
      const p = await apiRequest(`/payroll/staff/${id}/payments?limit=50`);
      setPayments(p.items || []);
    } catch (err) {
      setError(err.message);
      setUser(null);
      setPayments([]);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Staff Profile</h1>
          <p className="admin-subtitle">Details + salary payment history (read-only).</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-link" to="/hr/staff">Back to Staff</Link>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {!user && !error && (
        <div className="admin-surface admin-muted">Loading...</div>
      )}

      {user && (
        <div className="admin-two-col">
          <div className="admin-surface">
            <div className="admin-user-card">
              <div className="admin-avatar lg" aria-hidden="true">
                {(user.name || "S").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="admin-user-card-name">{user.name}</div>
                <div className="admin-muted">{user.email}</div>
                <div className="admin-muted" style={{ marginTop: 6 }}>{user.phone}</div>
                <div style={{ marginTop: 10 }}>
                  <span className={badge(`role-${user.role}`)}>{user.role}</span>
                  <span style={{ marginLeft: 10 }} className={badge(user.isBlocked ? "cancelled" : "delivered")}>
                    {user.staff?.employmentStatus || (user.isBlocked ? "inactive" : "active")}
                  </span>
                </div>
              </div>
            </div>

            <div className="admin-divider" />

            <div className="admin-kv">
              <div>
                <div className="admin-muted">National ID</div>
                <div className="admin-kv-strong">{user.staff?.nationalId || "-"}</div>
              </div>
              <div>
                <div className="admin-muted">Experience</div>
                <div className="admin-kv-strong">{user.staff?.experience || "-"}</div>
              </div>
              <div>
                <div className="admin-muted">Start Date</div>
                <div className="admin-kv-strong">{user.staff?.startDate ? new Date(user.staff.startDate).toLocaleDateString() : "-"}</div>
              </div>
              <div>
                <div className="admin-muted">Salary</div>
                <div className="admin-kv-strong">
                  {typeof user.staff?.monthlySalary === "number" ? `$${user.staff.monthlySalary}` : "-"}
                  {user.staff?.salaryPayDay ? <span className="admin-muted"> (day {user.staff.salaryPayDay})</span> : null}
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div className="admin-muted">Address</div>
                <div className="admin-kv-strong">{user.staff?.address || "-"}</div>
              </div>
              {user.staff?.employmentStatus === "terminated" && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <div className="admin-muted">Termination</div>
                  <div className="admin-kv-strong">
                    {user.staff?.terminationDate ? new Date(user.staff.terminationDate).toLocaleDateString() : "-"}{" "}
                    <span className="admin-muted">{user.staff?.terminationReason || ""}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="admin-surface">
            <div className="admin-surface-head">
              <h3 className="admin-surface-title">Salary Payments</h3>
              <p className="admin-surface-subtitle">Latest 50 payments for this staff.</p>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table admin-table-striped">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 900 }}>{p.month}</td>
                      <td>${Number(p.amount || 0).toFixed(2)}</td>
                      <td><span className={badge(p.status === "paid" ? "pay-paid" : "pay-unpaid")}>{p.status}</span></td>
                      <td className="admin-muted">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="admin-empty-cell">No salary payments.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRStaffDetailPage;


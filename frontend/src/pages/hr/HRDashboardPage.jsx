import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const isActiveEmployment = (u) => (u.staff?.employmentStatus || "active") === "active" && !u.isBlocked;

const nextDueDate = (payDay) => {
  const day = Number(payDay);
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const thisMonthDue = new Date(y, m, day);
  if (thisMonthDue >= new Date(y, m, now.getDate())) return thisMonthDue;
  return new Date(y, m + 1, day);
};

const daysBetween = (a, b) => Math.round((b - a) / (1000 * 60 * 60 * 24));

const HRDashboardPage = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiRequest("/staff?limit=500")
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const chefs = items.filter((u) => u.role === "chef").length;
    const waiters = items.filter((u) => u.role === "waiter").length;
    const delivery = items.filter((u) => u.role === "delivery").length;
    const active = items.filter((u) => isActiveEmployment(u)).length;
    const inactive = total - active;

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const newThisMonth = items.filter((u) => {
      const d = u.staff?.startDate ? new Date(u.staff.startDate) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return `${d.getFullYear()}-${d.getMonth()}` === monthKey;
    }).length;

    return { total, chefs, waiters, delivery, active, inactive, newThisMonth };
  }, [items]);

  const dueAlerts = useMemo(() => {
    const now = new Date();
    return items
      .map((u) => {
        const due = nextDueDate(u.staff?.salaryPayDay);
        if (!due) return null;
        const inDays = daysBetween(now, due);
        if (inDays < 0 || inDays > 3) return null;
        return { id: u._id, name: u.name, role: u.role, due, inDays };
      })
      .filter(Boolean)
      .sort((a, b) => a.inDays - b.inDays)
      .slice(0, 10);
  }, [items]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">HR Dashboard</h1>
          <p className="admin-subtitle">Staff overview, status, and upcoming salary alerts.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-link" to="/hr/staff">Manage staff</Link>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card animate-fade-in delay-100">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-user-group" /></div>
            <div>
              <div className="admin-stat-number">{stats.total}</div>
              <div className="admin-stat-label">Total Staff</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-200">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-kitchen-set" /></div>
            <div>
              <div className="admin-stat-number">{stats.chefs}</div>
              <div className="admin-stat-label">Chefs</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-300">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-bell-concierge" /></div>
            <div>
              <div className="admin-stat-number">{stats.waiters}</div>
              <div className="admin-stat-label">Waiters</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-400">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-truck-fast" /></div>
            <div>
              <div className="admin-stat-number">{stats.delivery}</div>
              <div className="admin-stat-label">Delivery</div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-two-col">
        <div className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Staff Status</h3>
            <p className="admin-surface-subtitle">Active vs inactive staff accounts.</p>
          </div>
          <div className="admin-kv">
            <div>
              <div className="admin-muted">Active</div>
              <div className="admin-kv-strong">{stats.active}</div>
            </div>
            <div>
              <div className="admin-muted">Inactive</div>
              <div className="admin-kv-strong">{stats.inactive}</div>
            </div>
            <div>
              <div className="admin-muted">New This Month</div>
              <div className="admin-kv-strong">{stats.newThisMonth}</div>
            </div>
          </div>
        </div>

        <div className="admin-surface">
          <div className="admin-surface-head row-between">
            <div>
              <h3 className="admin-surface-title">Salary Due Alerts</h3>
              <p className="admin-surface-subtitle">Next 3 days.</p>
            </div>
            <Link className="admin-link" to="/hr/salary-structures">Salary structure</Link>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Role</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {dueAlerts.map((x) => (
                  <tr key={x.id}>
                    <td style={{ fontWeight: 950 }}>{x.name}</td>
                    <td className="admin-muted">{x.role}</td>
                    <td className="admin-muted">{x.due.toLocaleDateString()}</td>
                  </tr>
                ))}
                {dueAlerts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="admin-empty-cell">No salary alerts.</td>
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

export default HRDashboardPage;


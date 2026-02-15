import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const FinanceDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [payroll, setPayroll] = useState([]);

  useEffect(() => {
    apiRequest("/finance/revenue")
      .then((d) => setSummary(d.summary))
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    apiRequest("/payroll/payments?limit=50")
      .then((d) => setPayroll(d.items || []))
      .catch(() => setPayroll([]));
  }, []);

  const payrollTotal = useMemo(() => payroll.reduce((s, x) => s + Number(x.amount || 0), 0), [payroll]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Finance Dashboard</h1>
          <p className="admin-subtitle">Revenue overview and payroll activity.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-link" to="/finance/payroll">Payroll</Link>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card animate-fade-in delay-100">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-circle-check" /></div>
            <div>
              <div className="admin-stat-number">${Number(summary?.paid?.totalAmount || 0).toFixed(2)}</div>
              <div className="admin-stat-label">Paid Revenue</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-200">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-hourglass-half" /></div>
            <div>
              <div className="admin-stat-number">${Number(summary?.unpaid?.totalAmount || 0).toFixed(2)}</div>
              <div className="admin-stat-label">Unpaid (COD)</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-300">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-rotate-left" /></div>
            <div>
              <div className="admin-stat-number">${Number(summary?.refunded?.totalAmount || 0).toFixed(2)}</div>
              <div className="admin-stat-label">Refunded</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-400">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-money-bill-wave" /></div>
            <div>
              <div className="admin-stat-number">${payrollTotal.toFixed(2)}</div>
              <div className="admin-stat-label">Loaded Payroll</div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-surface">
        <div className="admin-surface-head row-between">
          <div>
            <h3 className="admin-surface-title">Recent Payroll</h3>
            <p className="admin-surface-subtitle">Latest 50 salary payment records.</p>
          </div>
          <Link className="admin-link" to="/finance/payroll">View All</Link>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payroll.slice(0, 8).map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 950 }}>{p.staffId?.name || "-"}</td>
                  <td className="admin-muted">{p.month}</td>
                  <td>${Number(p.amount || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${p.status === "paid" ? "pay-paid" : "pay-unpaid"}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
              {payroll.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-empty-cell">No payroll records.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardPage;


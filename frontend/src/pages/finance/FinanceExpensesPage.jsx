import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

const FinanceExpensesPage = () => {
  const [report, setReport] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiRequest("/payroll/report")
      .then((data) => setReport(data.rows || []))
      .catch(() => setReport([]));

    apiRequest("/payroll/payments?limit=50")
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  const totals = useMemo(() => {
    const paid = report.filter((row) => row._id?.status === "paid").reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
    const unpaid = report.filter((row) => row._id?.status === "unpaid").reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
    return { paid, unpaid, total: paid + unpaid };
  }, [report]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Expenses</h1>
          <p className="admin-subtitle">Operational expenses currently tracked through payroll records.</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        {[
          { label: "Tracked Expenses", value: totals.total, icon: "fa-file-invoice-dollar" },
          { label: "Paid Payroll", value: totals.paid, icon: "fa-circle-check" },
          { label: "Unpaid Payroll", value: totals.unpaid, icon: "fa-hourglass-half" },
          { label: "Records", value: items.length, icon: "fa-receipt", money: false },
        ].map((card, index) => (
          <div key={card.label} className={`admin-stat-card animate-fade-in delay-${(index + 1) * 100}`}>
            <div className="admin-stat-top">
              <div className="admin-stat-icon"><i className={`fa-solid ${card.icon}`} /></div>
              <div>
                <div className="admin-stat-number">{card.money === false ? card.value : `$${Number(card.value || 0).toFixed(2)}`}</div>
                <div className="admin-stat-label">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-surface">
        <div className="admin-surface-head">
          <h3 className="admin-surface-title">Recent Expense Records</h3>
          <p className="admin-surface-subtitle">Latest payroll entries contributing to operational costs.</p>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Role</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 10).map((item) => (
                <tr key={item._id}>
                  <td style={{ fontWeight: 900 }}>{item.staffId?.name || "-"}</td>
                  <td className="admin-muted">{item.role}</td>
                  <td>{item.month}</td>
                  <td>${Number(item.amount || 0).toFixed(2)}</td>
                  <td><span className={`badge ${item.status === "paid" ? "pay-paid" : "pay-unpaid"}`}>{item.status}</span></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty-cell">No expense records available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceExpensesPage;

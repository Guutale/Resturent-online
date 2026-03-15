import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

const FinanceReportsPage = () => {
  const [revenue, setRevenue] = useState(null);
  const [payroll, setPayroll] = useState([]);

  useEffect(() => {
    apiRequest("/finance/revenue")
      .then((data) => setRevenue(data.summary))
      .catch(() => setRevenue(null));

    apiRequest("/payroll/report")
      .then((data) => setPayroll(data.rows || []))
      .catch(() => setPayroll([]));
  }, []);

  const groupedPayroll = useMemo(() => {
    const map = new Map();
    payroll.forEach((row) => {
      const role = row._id?.role || "unknown";
      const entry = map.get(role) || { paid: 0, unpaid: 0 };
      entry[row._id?.status || "paid"] = Number(row.totalAmount || 0);
      map.set(role, entry);
    });
    return [...map.entries()];
  }, [payroll]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Financial Reports</h1>
          <p className="admin-subtitle">A consolidated view of revenue and payroll by role.</p>
        </div>
      </div>

      <div className="admin-two-col">
        <section className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Revenue Snapshot</h3>
            <p className="admin-surface-subtitle">Current payment-state totals.</p>
          </div>
          <div className="admin-kv">
            <div>
              <div className="admin-muted">Gross Amount</div>
              <div className="admin-kv-strong">${Number(revenue?.grossAmount || 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="admin-muted">Net Amount</div>
              <div className="admin-kv-strong">${Number(revenue?.netAmount || 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="admin-muted">Paid Count</div>
              <div className="admin-kv-strong">{Number(revenue?.paid?.count || 0)}</div>
            </div>
          </div>
        </section>

        <section className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Payroll by Role</h3>
            <p className="admin-surface-subtitle">Paid vs unpaid payroll grouped by team.</p>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-striped">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Paid</th>
                  <th>Unpaid</th>
                </tr>
              </thead>
              <tbody>
                {groupedPayroll.map(([role, values]) => (
                  <tr key={role}>
                    <td style={{ fontWeight: 900 }}>{role}</td>
                    <td>${Number(values.paid || 0).toFixed(2)}</td>
                    <td>${Number(values.unpaid || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {groupedPayroll.length === 0 && (
                  <tr>
                    <td colSpan={3} className="admin-empty-cell">No payroll report data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FinanceReportsPage;

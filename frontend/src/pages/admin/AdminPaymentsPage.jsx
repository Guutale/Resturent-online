import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const statusClass = (status) => `badge pay-${status}`;

const AdminPaymentsPage = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    const params = new URLSearchParams();
    params.set("limit", "50");
    if (search.trim()) params.set("search", search.trim());
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
    if (paymentMethod) params.set("paymentMethod", paymentMethod);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    return apiRequest(`/payments?${params.toString()}`)
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    const t = setTimeout(() => load(), 220);
    return () => clearTimeout(t);
  }, [search, paymentStatus, paymentMethod, from, to]);

  const stats = useMemo(() => {
    const total = items.length;
    const paid = items.filter((p) => p.paymentStatus === "paid").length;
    const pending = items.filter((p) => p.paymentStatus === "pending").length;
    const unpaid = items.filter((p) => p.paymentStatus === "unpaid").length;
    const failed = items.filter((p) => p.paymentStatus === "failed").length;
    const refunded = items.filter((p) => p.paymentStatus === "refunded").length;
    const paidAmount = items
      .filter((p) => p.paymentStatus === "paid")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return { total, paid, pending, unpaid, failed, refunded, paidAmount };
  }, [items]);

  const update = async (id, next) => {
    setError("");
    try {
      const body = { paymentStatus: next };
      if (next === "failed") {
        const reason = window.prompt("Failure reason (optional):") || "";
        if (reason.trim()) body.failureReason = reason.trim();
      }
      await apiRequest(`/payments/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const viewProof = async (id) => {
    setError("");
    try {
      const d = await apiRequest(`/payments/${id}`);
      const proof = d?.item?.proofImageUrl;
      const tx = d?.item?.transactionReference;
      if (!proof) {
        throw new Error(tx ? "No screenshot uploaded (transaction ref exists)." : "No screenshot uploaded for this payment.");
      }
      window.open(proof, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Payments</h1>
          <p className="admin-subtitle">Filter payments and update payment status.</p>
        </div>
        <div className="admin-actions">
          <div className="admin-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              className="admin-input"
              placeholder="Search order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="admin-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="">All methods</option>
            <option value="COD">COD</option>
            <option value="CARD">Card</option>
            <option value="EVCPLUS">EVCPlus</option>
          </select>
          <select className="admin-select" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="unpaid">Unpaid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <input className="admin-input admin-date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input className="admin-input admin-date" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card animate-fade-in delay-100">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-credit-card" /></div>
            <div>
              <div className="admin-stat-number">{stats.total}</div>
              <div className="admin-stat-label">Loaded Payments</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-200">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-circle-check" /></div>
            <div>
              <div className="admin-stat-number">{stats.paid}</div>
              <div className="admin-stat-label">Paid</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-300">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-hourglass-half" /></div>
            <div>
              <div className="admin-stat-number">{stats.pending}</div>
              <div className="admin-stat-label">Pending Verification</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-400">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-money-bill-wave" /></div>
            <div>
              <div className="admin-stat-number">{stats.unpaid}</div>
              <div className="admin-stat-label">Unpaid</div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-surface">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Method</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Tx Ref</th>
                <th>Proof</th>
                <th>Date</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id}>
                  <td>
                    <Link className="admin-link" to={`/admin/orders/${p.orderId}`}>{p.orderNumber}</Link>
                  </td>
                  <td style={{ fontWeight: 900 }}>{p.paymentMethod}</td>
                  <td><span className={statusClass(p.paymentStatus)}>{p.paymentStatus}</span></td>
                  <td>${Number(p.amount || 0).toFixed(2)}</td>
                  <td className="admin-muted" style={{ fontWeight: 800 }}>{p.transactionReference || "-"}</td>
                  <td>
                    <button type="button" className="admin-btn-link" onClick={() => viewProof(p._id)}>
                      View
                    </button>
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select className="admin-select" value={p.paymentStatus} onChange={(e) => update(p._id, e.target.value)}>
                      <option value="unpaid">unpaid</option>
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                      <option value="failed">failed</option>
                      <option value="refunded">refunded</option>
                    </select>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="admin-empty-cell">No payments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="admin-muted" style={{ marginTop: 10 }}>
          Paid amount (loaded): <strong>${stats.paidAmount.toFixed(2)}</strong>
        </div>
        <div className="admin-muted" style={{ marginTop: 6 }}>
          Failed: <strong>{stats.failed}</strong> · Refunded: <strong>{stats.refunded}</strong>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;

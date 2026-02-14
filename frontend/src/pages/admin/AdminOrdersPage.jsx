import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const statuses = ["pending", "preparing", "ready", "assigned", "out_for_delivery", "delivered", "failed", "cancelled", "on_the_way"];
const statusClass = (status) => `badge ${status}`;

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    const params = new URLSearchParams();
    params.set("limit", "50");
    if (tab !== "all") params.set("status", tab);
    if (search.trim()) params.set("search", search.trim());
    return apiRequest(`/orders?${params.toString()}`)
      .then((d) => setOrders(d.items || []))
      .catch(() => setOrders([]));
  };

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 200);
    return () => clearTimeout(t);
  }, [tab, search]);

  const update = async (id, status) => {
    setError("");
    try {
      await apiRequest(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
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
          <h1 className="admin-title">Orders</h1>
          <p className="admin-subtitle">Search orders and update statuses.</p>
        </div>
        <div className="admin-actions">
          <div className="admin-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              className="admin-input"
              placeholder="Search by order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-tabs">
        <button type="button" className={`admin-tab${tab === "all" ? " active" : ""}`} onClick={() => setTab("all")}>All</button>
        <button type="button" className={`admin-tab${tab === "pending" ? " active" : ""}`} onClick={() => setTab("pending")}>Pending</button>
        <button type="button" className={`admin-tab${tab === "preparing" ? " active" : ""}`} onClick={() => setTab("preparing")}>Preparing</button>
        <button type="button" className={`admin-tab${tab === "ready" ? " active" : ""}`} onClick={() => setTab("ready")}>Ready</button>
        <button type="button" className={`admin-tab${tab === "assigned" ? " active" : ""}`} onClick={() => setTab("assigned")}>Assigned</button>
        <button type="button" className={`admin-tab${tab === "out_for_delivery" ? " active" : ""}`} onClick={() => setTab("out_for_delivery")}>Out for Delivery</button>
        <button type="button" className={`admin-tab${tab === "delivered" ? " active" : ""}`} onClick={() => setTab("delivered")}>Delivered</button>
        <button type="button" className={`admin-tab${tab === "failed" ? " active" : ""}`} onClick={() => setTab("failed")}>Failed</button>
        <button type="button" className={`admin-tab${tab === "cancelled" ? " active" : ""}`} onClick={() => setTab("cancelled")}>Cancelled</button>
      </div>

      <div className="admin-surface">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td><Link className="admin-link" to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link></td>
                  <td><span className={statusClass(o.status)}>{o.status}</span></td>
                  <td>${Number(o.total || 0).toFixed(2)}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select className="admin-select" value={o.status} onChange={(e) => update(o._id, e.target.value)}>
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty-cell">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;

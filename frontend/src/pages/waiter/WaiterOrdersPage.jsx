import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const WaiterOrdersPage = ({ scope = "active" }) => {
  const [items, setItems] = useState([]);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    apiRequest(`/orders/waiter?scope=${scope}&limit=100`)
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));

  useEffect(() => {
    load();
  }, [scope]);

  const saveNotes = async (order) => {
    setError("");
    setSavingId(order._id);
    try {
      await apiRequest(`/orders/${order._id}/waiter`, {
        method: "PATCH",
        body: JSON.stringify({ serviceNotes: order.serviceNotes || "" }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId("");
    }
  };

  const markServed = async (id) => {
    setError("");
    setSavingId(id);
    try {
      await apiRequest(`/orders/${id}/waiter`, {
        method: "PATCH",
        body: JSON.stringify({ status: "delivered" }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{scope === "history" ? "Served Orders" : "Active Orders"}</h1>
          <p className="admin-subtitle">
            {scope === "history" ? "Completed or closed dine-in orders handled by your account." : "Track active table orders, kitchen status, and service notes."}
          </p>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-striped">
          <thead>
            <tr>
              <th>Order</th>
              <th>Table</th>
              <th>Status</th>
              <th>Total</th>
              <th>Notes</th>
              {scope !== "history" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((order) => (
              <tr key={order._id}>
                <td style={{ fontWeight: 900 }}>{order.orderNumber}</td>
                <td className="admin-muted">{order.tableLabel || "-"}</td>
                <td><span className={`badge ${order.status}`}>{order.status}</span></td>
                <td>${Number(order.total || 0).toFixed(2)}</td>
                <td style={{ minWidth: 260 }}>
                  {scope === "history" ? (
                    <span className="admin-muted">{order.serviceNotes || "-"}</span>
                  ) : (
                    <textarea
                      className="admin-input"
                      rows={3}
                      value={order.serviceNotes || ""}
                      onChange={(event) => setItems((current) => current.map((entry) => (
                        entry._id === order._id ? { ...entry, serviceNotes: event.target.value } : entry
                      )))}
                    />
                  )}
                </td>
                {scope !== "history" && (
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="admin-btn-secondary" onClick={() => saveNotes(order)} disabled={savingId === order._id}>
                        {savingId === order._id ? "Saving..." : "Save notes"}
                      </button>
                      {order.status === "ready" && (
                        <button type="button" className="admin-btn-primary" onClick={() => markServed(order._id)} disabled={savingId === order._id}>
                          Serve order
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={scope === "history" ? 5 : 6} className="admin-empty-cell">
                  {scope === "history" ? "No served orders yet." : "No active orders yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WaiterOrdersPage;

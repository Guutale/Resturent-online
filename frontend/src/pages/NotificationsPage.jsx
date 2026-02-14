import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

const NotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const load = () =>
    apiRequest("/notifications/my?limit=50")
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    setError("");
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const markAll = async () => {
    setError("");
    try {
      await apiRequest("/notifications/my/read-all", { method: "PATCH" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: "0.9rem" }}>
        <h2 className="page-title" style={{ margin: 0 }}><i className="fa-regular fa-bell" /> Notifications</h2>
        <button type="button" className="btn-ghost" onClick={markAll}>Mark all read</button>
      </div>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <div className="panel">
        {items.length === 0 && <p className="muted">No notifications yet.</p>}
        {items.map((n) => (
          <div key={n._id} className="row-between cart-line" style={{ gap: "1rem" }}>
            <div>
              <div style={{ fontWeight: 900 }}>{n.title}</div>
              <div className="muted" style={{ marginTop: 2 }}>{n.message}</div>
              <div className="muted" style={{ marginTop: 6, fontSize: "0.9rem" }}>{new Date(n.createdAt).toLocaleString()}</div>
              {n.data?.orderId && (
                <div style={{ marginTop: 8 }}>
                  <Link className="auth-link" to={`/orders/${n.data.orderId}`}>View order</Link>
                </div>
              )}
            </div>
            {!n.isRead && (
              <button type="button" className="btn-ghost" onClick={() => markRead(n._id)}>Read</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;


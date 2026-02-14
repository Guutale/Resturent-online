import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const AdminNotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const load = () =>
    apiRequest("/notifications/admin?limit=50")
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
      await apiRequest("/notifications/admin/read-all", { method: "PATCH" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Notifications</h1>
          <p className="admin-subtitle">New orders, low stock alerts, and payment updates.</p>
        </div>
        <div className="admin-actions">
          <button type="button" className="admin-btn-secondary" onClick={markAll}>
            Mark all read
          </button>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-note-list">
        {items.map((n) => (
          <div key={n._id} className={`admin-note ${n.isRead ? "read" : "unread"}`}>
            <div className="admin-note-top">
              <div>
                <div className="admin-note-title">{n.title}</div>
                <div className="admin-note-message">{n.message}</div>
              </div>
              <div className="admin-note-meta">
                <div className="admin-muted">{new Date(n.createdAt).toLocaleString()}</div>
                {!n.isRead && (
                  <button type="button" className="admin-btn-primary" onClick={() => markRead(n._id)}>
                    Mark read
                  </button>
                )}
              </div>
            </div>

            {n.data?.orderId && (
              <div style={{ marginTop: 10 }}>
                <Link className="admin-link" to={`/admin/orders/${n.data.orderId}`}>
                  View order
                </Link>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><i className="fa-solid fa-bell" /></div>
            <div className="admin-empty-title">No notifications</div>
            <div className="admin-muted">You're all caught up.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;


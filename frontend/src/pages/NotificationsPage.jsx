import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

const NotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () =>
    apiRequest("/notifications/my?limit=50")
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

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

  const unreadCount = items.filter((item) => !item.isRead).length;

  if (loading) {
    return (
      <div className="page notifications-page">
        <div className="panel loading-card">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="page notifications-page">
      <section className="panel orders-hero notifications-hero">
        <div>
          <p className="section-kicker">Notifications</p>
          <h1 className="page-title">Stay close to every order and payment update.</h1>
        </div>

        <div className="notifications-hero-actions">
          <div className="detail-meta-card">
            <span className="detail-meta-label">Unread</span>
            <strong>{unreadCount}</strong>
          </div>
          <button type="button" className="btn-ghost" onClick={markAll}>Mark all read</button>
        </div>
      </section>

      {error && <div className="form-alert error">{error}</div>}

      {items.length === 0 ? (
        <section className="panel empty-state">
          <span className="empty-state-icon">
            <i className="fa-regular fa-bell" />
          </span>
          <h2 className="page-title">No notifications yet.</h2>
          <p className="muted">Order updates, payment reminders, and delivery milestones will appear here.</p>
        </section>
      ) : (
        <section className="notifications-list">
          {items.map((item) => (
            <article key={item._id} className={`panel notification-card ${item.isRead ? "" : "is-unread"}`}>
              <div className="notification-head">
                <div>
                  <strong>{item.title}</strong>
                  <p className="muted">{item.message}</p>
                </div>
                {!item.isRead && <span className="status-chip">Unread</span>}
              </div>

              <div className="notification-footer">
                <span className="muted">{new Date(item.createdAt).toLocaleString()}</span>
                <div className="notification-actions">
                  {item.data?.orderId && (
                    <Link className="btn-ghost" to={`/orders/${item.data.orderId}`}>View order</Link>
                  )}
                  {!item.isRead && (
                    <button type="button" className="btn-ghost" onClick={() => markRead(item._id)}>
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default NotificationsPage;

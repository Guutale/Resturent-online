import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const statusClass = (status) => `badge ${status}`;

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const u = await apiRequest(`/users/${id}`);
      setUser(u.user);
      const o = await apiRequest(`/users/${id}/orders?limit=50`);
      setOrders(o.items || []);
    } catch (err) {
      setError(err.message);
      setUser(null);
      setOrders([]);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">User Details</h1>
          <p className="admin-subtitle">Profile and order history.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-link" to="/admin/users">Back to Users</Link>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {user && (
        <div className="admin-two-col">
          <div className="admin-surface">
            <div className="admin-user-card">
              <div className="admin-avatar lg" aria-hidden="true">
                {(user.name || "U").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="admin-user-card-name">{user.name}</div>
                <div className="admin-muted">{user.email}</div>
                <div style={{ marginTop: 10 }}>
                  <span className={`badge role-${user.role}`}>{user.role}</span>
                  <span style={{ marginLeft: 10 }} className={`badge ${user.isBlocked ? "cancelled" : "delivered"}`}>
                    {user.isBlocked ? "Blocked" : "Active"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-surface">
            <div className="admin-surface-head">
              <h3 className="admin-surface-title">Orders</h3>
              <p className="admin-surface-subtitle">Latest 50 orders for this user.</p>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table admin-table-striped">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td><Link className="admin-link" to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link></td>
                      <td><span className={statusClass(o.status)}>{o.status}</span></td>
                      <td>${Number(o.total || 0).toFixed(2)}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="admin-empty-cell">No orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!user && !error && (
        <div className="admin-surface admin-muted">Loading...</div>
      )}
    </div>
  );
};

export default AdminUserDetailPage;


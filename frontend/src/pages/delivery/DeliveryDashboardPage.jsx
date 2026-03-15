import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const loadStatus = (status) => apiRequest(`/orders/assigned?limit=100&status=${status}`).then((data) => data.items || []).catch(() => []);

const DeliveryDashboardPage = () => {
  const [assigned, setAssigned] = useState([]);
  const [inProgress, setInProgress] = useState([]);
  const [delivered, setDelivered] = useState([]);
  const [failed, setFailed] = useState([]);

  useEffect(() => {
    Promise.all([
      loadStatus("assigned"),
      loadStatus("out_for_delivery"),
      loadStatus("delivered"),
      loadStatus("failed"),
    ]).then(([assignedItems, inProgressItems, deliveredItems, failedItems]) => {
      setAssigned(assignedItems);
      setInProgress(inProgressItems);
      setDelivered(deliveredItems);
      setFailed(failedItems);
    });
  }, []);

  const recent = useMemo(
    () => [...assigned, ...inProgress].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)).slice(0, 8),
    [assigned, inProgress]
  );

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Delivery Dashboard</h1>
          <p className="admin-subtitle">Track assigned trips, in-progress drops, and recent delivery outcomes.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-link" to="/delivery/assigned">Open assigned deliveries</Link>
        </div>
      </div>

      <div className="admin-stats-grid">
        {[
          { label: "Assigned", value: assigned.length, icon: "fa-box-open" },
          { label: "On the way", value: inProgress.length, icon: "fa-route" },
          { label: "Completed", value: delivered.length, icon: "fa-circle-check" },
          { label: "Failed", value: failed.length, icon: "fa-circle-xmark" },
        ].map((card, index) => (
          <div key={card.label} className={`admin-stat-card animate-fade-in delay-${(index + 1) * 100}`}>
            <div className="admin-stat-top">
              <div className="admin-stat-icon"><i className={`fa-solid ${card.icon}`} /></div>
              <div>
                <div className="admin-stat-number">{card.value}</div>
                <div className="admin-stat-label">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-surface">
        <div className="admin-surface-head row-between">
          <div>
            <h3 className="admin-surface-title">Recent Delivery Queue</h3>
            <p className="admin-surface-subtitle">Your latest active delivery tasks.</p>
          </div>
          <Link className="admin-link" to="/delivery/history">History</Link>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((order) => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 900 }}>{order.orderNumber}</td>
                  <td><span className={`badge ${order.status}`}>{order.status}</span></td>
                  <td>
                    <div style={{ fontWeight: 800 }}>{order.customer?.name || "-"}</div>
                    <div className="admin-muted">{order.customer?.phone || "-"}</div>
                  </td>
                  <td className="admin-muted">{order.deliveryAddress?.district}, {order.deliveryAddress?.street}</td>
                  <td className="admin-muted">{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty-cell">No delivery work assigned yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboardPage;

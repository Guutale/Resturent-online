import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const deriveKitchenStatus = (order) => {
  if (order.kitchenStatus) return order.kitchenStatus;
  if (order.status === "preparing") return "cooking";
  if (order.status === "ready") return "ready";
  return "pending";
};

const ChefDashboardPage = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiRequest("/orders/kitchen?limit=100")
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((order) => deriveKitchenStatus(order) === "pending").length,
    cooking: items.filter((order) => deriveKitchenStatus(order) === "cooking").length,
    ready: items.filter((order) => deriveKitchenStatus(order) === "ready").length,
  }), [items]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Chef Dashboard</h1>
          <p className="admin-subtitle">Monitor the kitchen queue and move dishes through preparation stages.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-link" to="/chef/queue">Open kitchen queue</Link>
        </div>
      </div>

      <div className="admin-stats-grid">
        {[
          { label: "Kitchen Queue", value: stats.total, icon: "fa-list-check" },
          { label: "Pending", value: stats.pending, icon: "fa-hourglass-start" },
          { label: "Preparing", value: stats.cooking, icon: "fa-fire-burner" },
          { label: "Ready", value: stats.ready, icon: "fa-circle-check" },
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
        <div className="admin-surface-head">
          <h3 className="admin-surface-title">Incoming Orders</h3>
          <p className="admin-surface-subtitle">The next orders waiting for attention in the kitchen.</p>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Items</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 8).map((order) => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 900 }}>{order.orderNumber}</td>
                  <td><span className={`badge ${deriveKitchenStatus(order)}`}>{deriveKitchenStatus(order)}</span></td>
                  <td className="admin-muted">{(order.items || []).map((item) => `${item.title} x${item.qty}`).join(", ")}</td>
                  <td className="admin-muted">{order.serviceNotes || order.deliveryAddress?.notes || "-"}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-empty-cell">No kitchen orders at the moment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChefDashboardPage;

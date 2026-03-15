import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

const AdminReportsPage = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      apiRequest("/orders?limit=100").then((data) => data.items || []).catch(() => []),
      apiRequest("/users?limit=100").then((data) => data.items || []).catch(() => []),
      apiRequest("/payments?limit=100").then((data) => data.items || []).catch(() => []),
      apiRequest("/products?limit=100").then((data) => data.items || []).catch(() => []),
    ]).then(([orderItems, userItems, paymentItems, productItems]) => {
      setOrders(orderItems);
      setUsers(userItems);
      setPayments(paymentItems);
      setProducts(productItems);
    });
  }, []);

  const metrics = useMemo(() => ({
    revenue: payments.filter((item) => item.paymentStatus === "paid").reduce((sum, item) => sum + Number(item.amount || 0), 0),
    activeUsers: users.filter((item) => !item.isBlocked).length,
    lowStock: products.filter((item) => typeof item.stockQty === "number" && item.stockQty <= Number(item.lowStockThreshold || 0)).length,
    delivered: orders.filter((item) => item.status === "delivered").length,
  }), [orders, payments, products, users]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Reports</h1>
          <p className="admin-subtitle">Operational and revenue snapshots pulled from live user, order, product, and payment data.</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        {[
          { label: "Paid Revenue", value: `$${metrics.revenue.toFixed(2)}`, icon: "fa-sack-dollar" },
          { label: "Active Users", value: metrics.activeUsers, icon: "fa-user-check" },
          { label: "Delivered Orders", value: metrics.delivered, icon: "fa-circle-check" },
          { label: "Low Stock Items", value: metrics.lowStock, icon: "fa-triangle-exclamation" },
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

      <div className="admin-two-col">
        <section className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Order Status Mix</h3>
            <p className="admin-surface-subtitle">Latest loaded order distribution.</p>
          </div>
          <div className="dashboard-stat-list">
            {["pending", "preparing", "ready", "assigned", "out_for_delivery", "delivered", "failed", "cancelled"].map((status) => (
              <div key={status} className="dashboard-stat-row">
                <span>{status}</span>
                <strong>{orders.filter((order) => order.status === status).length}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Payment Status Mix</h3>
            <p className="admin-surface-subtitle">Current loaded payment distribution.</p>
          </div>
          <div className="dashboard-stat-list">
            {["paid", "pending", "unpaid", "failed", "refunded"].map((status) => (
              <div key={status} className="dashboard-stat-row">
                <span>{status}</span>
                <strong>{payments.filter((payment) => payment.paymentStatus === status).length}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminReportsPage;

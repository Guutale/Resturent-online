import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

const statusClass = (status) => `badge ${status}`;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    apiRequest("/orders/my")
      .then((data) => {
        if (!isMounted) return;
        setOrders(data.items || []);
      })
      .catch(() => {
        if (!isMounted) return;
        setOrders([]);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeOrders = orders.filter((order) => !["delivered", "cancelled", "failed"].includes(order.status)).length;
  const paidOrders = orders.filter((order) => order.paymentStatus === "paid").length;

  if (loading) {
    return (
      <div className="page orders-page">
        <div className="panel loading-card">Loading your orders...</div>
      </div>
    );
  }

  return (
    <div className="page orders-page">
      <section className="panel orders-hero">
        <div>
          <p className="section-kicker">My orders</p>
          <h1 className="page-title">Every order, status update, and payment checkpoint in one view.</h1>
        </div>

        <div className="account-hero-stats">
          <div className="detail-meta-card">
            <span className="detail-meta-label">Total orders</span>
            <strong>{orders.length}</strong>
          </div>
          <div className="detail-meta-card">
            <span className="detail-meta-label">Active</span>
            <strong>{activeOrders}</strong>
          </div>
          <div className="detail-meta-card">
            <span className="detail-meta-label">Paid</span>
            <strong>{paidOrders}</strong>
          </div>
        </div>
      </section>

      {orders.length === 0 ? (
        <section className="panel empty-state">
          <span className="empty-state-icon">
            <i className="fa-solid fa-box-open" />
          </span>
          <h2 className="page-title">No orders yet.</h2>
          <p className="muted">Start with the menu and your first order will appear here.</p>
          <Link to="/menu" className="btn">Browse menu</Link>
        </section>
      ) : (
        <section className="orders-list">
          {orders.map((order) => (
            <article key={order._id} className="panel order-card">
              <div className="order-card-head">
                <div>
                  <p className="section-kicker">Order</p>
                  <h2 className="order-card-number">{order.orderNumber}</h2>
                </div>
                <span className={statusClass(order.status)}>{order.status.replaceAll("_", " ")}</span>
              </div>

              <div className="order-card-grid">
                <div className="detail-meta-card">
                  <span className="detail-meta-label">Total</span>
                  <strong>${Number(order.total || 0).toFixed(2)}</strong>
                </div>
                <div className="detail-meta-card">
                  <span className="detail-meta-label">Payment</span>
                  <strong>{order.paymentStatus}</strong>
                </div>
                <div className="detail-meta-card">
                  <span className="detail-meta-label">Placed on</span>
                  <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                </div>
              </div>

              <div className="order-card-footer">
                <span className="muted">{order.items?.length || 0} item{order.items?.length === 1 ? "" : "s"} in this order</span>
                <Link className="btn-ghost" to={`/orders/${order._id}`}>View details</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default OrdersPage;

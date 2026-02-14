import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

const statusClass = (status) => `badge ${status}`;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    apiRequest("/orders/my")
      .then((d) => setOrders(d.items || []))
      .catch(() => setOrders([]));
  }, []);

  return (
    <div className="page panel">
      <h2 className="page-title"><i className="fa-solid fa-box-open" /> My Orders</h2>
      {orders.length === 0 && <p className="muted">No orders yet. Start with the <Link to="/menu" className="auth-link">menu</Link>.</p>}
      <table>
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
              <td><Link to={`/orders/${o._id}`}>{o.orderNumber}</Link></td>
              <td><span className={statusClass(o.status)}>{o.status}</span></td>
              <td>${o.total}</td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersPage;

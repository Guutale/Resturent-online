import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";

const statusClass = (status) => `badge ${status}`;
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api").replace(/\/+$/, "");

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    apiRequest(`/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch(() => setOrder(null));
  }, [id]);

  if (!order) return <div className="page"><div className="panel muted">Loading order...</div></div>;

  return (
    <div className="page panel">
      <h2 className="page-title"><i className="fa-solid fa-receipt" /> {order.orderNumber}</h2>
      <p>Status: <span className={statusClass(order.status)}>{order.status}</span></p>
      <p>Total: ${order.total}</p>
      <a className="btn-ghost" href={`${API_BASE}/orders/${order._id}/invoice`} target="_blank" rel="noreferrer">
        View invoice
      </a>
      <h3>Items</h3>
      {order.items.map((i) => (
        <p key={i.productId}>{i.title} x{i.qty} - ${i.price}</p>
      ))}
      <h3>Address</h3>
      <p>{order.deliveryAddress.city}, {order.deliveryAddress.district}, {order.deliveryAddress.street}</p>
    </div>
  );
};

export default OrderDetailPage;

import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const ChefPreparingOrdersPage = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiRequest("/orders/kitchen?kitchenStatus=cooking&limit=100")
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Preparing Orders</h1>
          <p className="admin-subtitle">Orders currently being prepared by the kitchen team.</p>
        </div>
      </div>

      <div className="admin-surface">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Order</th>
                <th>Items</th>
                <th>Notes</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 900 }}>{order.orderNumber}</td>
                  <td className="admin-muted">{(order.items || []).map((item) => `${item.title} x${item.qty}`).join(", ")}</td>
                  <td className="admin-muted">{order.serviceNotes || order.deliveryAddress?.notes || "-"}</td>
                  <td className="admin-muted">{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-empty-cell">No orders are currently in preparation.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChefPreparingOrdersPage;

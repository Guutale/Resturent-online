import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const ChefCompletedOrdersPage = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiRequest("/orders/kitchen?scope=completed&limit=100")
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Completed Orders</h1>
          <p className="admin-subtitle">Orders that already left the kitchen workflow.</p>
        </div>
      </div>

      <div className="admin-surface">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Type</th>
                <th>Items</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 900 }}>{order.orderNumber}</td>
                  <td><span className={`badge ${order.status}`}>{order.status}</span></td>
                  <td className="admin-muted">{order.orderSource === "dine_in" ? `Table ${order.tableLabel || "-"}` : "Delivery"}</td>
                  <td className="admin-muted">{(order.items || []).length}</td>
                  <td className="admin-muted">{new Date(order.updatedAt || order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty-cell">No completed kitchen orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChefCompletedOrdersPage;

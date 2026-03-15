import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

const loadHistoryStatus = (status) =>
  apiRequest(`/orders/assigned?limit=100&status=${status}`).then((data) => data.items || []).catch(() => []);

const DeliveryHistoryPage = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    Promise.all([loadHistoryStatus("delivered"), loadHistoryStatus("failed")]).then(([delivered, failed]) => {
      setItems([...delivered, ...failed]);
    });
  }, []);

  const sorted = useMemo(
    () => [...items].sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt)),
    [items]
  );

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Delivery History</h1>
          <p className="admin-subtitle">Completed and failed delivery attempts assigned to your account.</p>
        </div>
      </div>

      <div className="admin-surface">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Total</th>
                <th>Customer</th>
                <th>Finished</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((order) => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 900 }}>{order.orderNumber}</td>
                  <td><span className={`badge ${order.status}`}>{order.status}</span></td>
                  <td>${Number(order.total || 0).toFixed(2)}</td>
                  <td className="admin-muted">{order.customer?.name || "-"}</td>
                  <td className="admin-muted">{new Date(order.updatedAt || order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty-cell">No delivery history yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeliveryHistoryPage;

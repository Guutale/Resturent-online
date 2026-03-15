import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const ChefNotesPage = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiRequest("/orders/kitchen?limit=100")
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Kitchen Notes</h1>
          <p className="admin-subtitle">Service notes and delivery comments attached to active orders.</p>
        </div>
      </div>

      <div className="dashboard-note-grid">
        {items.map((order) => (
          <article key={order._id} className="admin-surface dashboard-note-card">
            <div className="admin-surface-head">
              <div>
                <h3 className="admin-surface-title">{order.orderNumber}</h3>
                <p className="admin-surface-subtitle">{order.orderSource === "dine_in" ? `Table ${order.tableLabel || "-"}` : "Delivery order"}</p>
              </div>
              <span className={`badge ${order.kitchenStatus || "pending"}`}>{order.kitchenStatus || "pending"}</span>
            </div>
            <p className="admin-muted">{order.serviceNotes || order.deliveryAddress?.notes || "No kitchen notes for this order."}</p>
          </article>
        ))}
        {items.length === 0 && (
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><i className="fa-solid fa-note-sticky" /></div>
            <div className="admin-empty-title">No kitchen notes available</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefNotesPage;

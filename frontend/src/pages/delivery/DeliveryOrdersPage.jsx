import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const statusClass = (status) => `badge ${status}`;

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api").replace(/\/+$/, "");

const DeliveryOrdersPage = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const load = () =>
    apiRequest("/orders/assigned?limit=50")
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));

  useEffect(() => {
    load();
  }, []);

  const update = async (id, status) => {
    setError("");
    try {
      await apiRequest(`/orders/${id}/delivery-status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Assigned Orders</h1>
          <p className="admin-subtitle">Update delivery status for your assigned orders.</p>
        </div>
        <div className="admin-actions">
          <button type="button" className="admin-btn-secondary" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-surface">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Total</th>
                <th>Address</th>
                <th style={{ width: 240 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o._id}>
                  <td style={{ fontWeight: 950 }}>{o.orderNumber}</td>
                  <td><span className={statusClass(o.status)}>{o.status}</span></td>
                  <td>${Number(o.total || 0).toFixed(2)}</td>
                  <td className="admin-muted">
                    <div>{o.deliveryAddress?.district}, {o.deliveryAddress?.street}</div>
                    <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {o.customer?.phone && (
                        <a className="admin-link" href={`tel:${o.customer.phone}`}>
                          <i className="fa-solid fa-phone" /> Call
                        </a>
                      )}
                      {o.deliveryLocation?.mapsLink && (
                        <a className="admin-link" href={o.deliveryLocation.mapsLink} target="_blank" rel="noreferrer">
                          <i className="fa-solid fa-location-dot" /> Map
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      {o.status === "assigned" && (
                        <button type="button" className="admin-btn-primary" onClick={() => update(o._id, "out_for_delivery")}>
                          Out for delivery
                        </button>
                      )}
                      {o.status === "out_for_delivery" && (
                        <>
                          <button type="button" className="admin-btn-primary" onClick={() => update(o._id, "delivered")}>
                            Delivered
                          </button>
                          <button type="button" className="admin-btn-secondary" onClick={() => update(o._id, "failed")}>
                            Failed
                          </button>
                        </>
                      )}
                      <a className="admin-btn-link" href={`${API_BASE}/orders/${o._id}/invoice`} target="_blank" rel="noreferrer">
                        <i className="fa-solid fa-file-invoice" /> Invoice
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty-cell">No assigned orders.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeliveryOrdersPage;

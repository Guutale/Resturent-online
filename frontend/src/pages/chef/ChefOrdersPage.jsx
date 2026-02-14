import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

const badge = (value) => `badge ${value}`;

const deriveKitchenStatus = (o) => {
  if (o.kitchenStatus) return o.kitchenStatus;
  if (o.status === "preparing") return "cooking";
  if (o.status === "ready") return "ready";
  return "pending";
};

const ChefOrdersPage = () => {
  const [items, setItems] = useState([]);
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [assignTo, setAssignTo] = useState({});
  const [error, setError] = useState("");

  const load = () =>
    apiRequest("/orders/kitchen?limit=50")
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));

  const loadDelivery = () =>
    apiRequest("/delivery-staff?availabilityStatus=available&isBlocked=false&limit=200")
      .then((d) => setDeliveryStaff(d.items || []))
      .catch(() => setDeliveryStaff([]));

  useEffect(() => {
    load();
    loadDelivery();
  }, []);

  const updateKitchen = async (id, kitchenStatus) => {
    setError("");
    try {
      await apiRequest(`/orders/${id}/kitchen-status`, {
        method: "PATCH",
        body: JSON.stringify({ kitchenStatus }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const assignDelivery = async (orderId) => {
    setError("");
    const deliveryUserId = assignTo[orderId];
    if (!deliveryUserId) return;
    try {
      await apiRequest(`/orders/${orderId}/assign-delivery`, {
        method: "PATCH",
        body: JSON.stringify({ deliveryUserId }),
      });
      setAssignTo((p) => {
        const next = { ...p };
        delete next[orderId];
        return next;
      });
      load();
      loadDelivery();
    } catch (err) {
      setError(err.message);
    }
  };

  const counts = useMemo(() => {
    const pending = items.filter((o) => deriveKitchenStatus(o) === "pending").length;
    const cooking = items.filter((o) => deriveKitchenStatus(o) === "cooking").length;
    const ready = items.filter((o) => deriveKitchenStatus(o) === "ready").length;
    return { pending, cooking, ready, total: items.length };
  }, [items]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Kitchen Dashboard</h1>
          <p className="admin-subtitle">Update kitchen workflow: Pending → Cooking → Ready.</p>
        </div>
        <div className="admin-actions">
          <button type="button" className="admin-btn-secondary" onClick={() => { load(); loadDelivery(); }}>
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card animate-fade-in delay-100">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-list-check" /></div>
            <div>
              <div className="admin-stat-number">{counts.total}</div>
              <div className="admin-stat-label">Kitchen Orders</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-200">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-hourglass-start" /></div>
            <div>
              <div className="admin-stat-number">{counts.pending}</div>
              <div className="admin-stat-label">Pending</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-300">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-fire-burner" /></div>
            <div>
              <div className="admin-stat-number">{counts.cooking}</div>
              <div className="admin-stat-label">Cooking</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-400">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-circle-check" /></div>
            <div>
              <div className="admin-stat-number">{counts.ready}</div>
              <div className="admin-stat-label">Ready</div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-surface">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Order</th>
                <th>Kitchen</th>
                <th>Items</th>
                <th>Notes</th>
                <th>Date</th>
                <th style={{ width: 360 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => {
                const kitchen = deriveKitchenStatus(o);
                const itemsLabel = (o.items || []).map((i) => `${i.title} x${i.qty}`).join(", ");
                return (
                  <tr key={o._id}>
                    <td style={{ fontWeight: 950 }}>{o.orderNumber}</td>
                    <td><span className={badge(kitchen)}>{kitchen}</span></td>
                    <td className="admin-muted">{itemsLabel || "-"}</td>
                    <td className="admin-muted">{o.deliveryAddress?.notes || "-"}</td>
                    <td className="admin-muted">{new Date(o.createdAt).toLocaleString()}</td>
                    <td>
                      <div className="admin-row-actions">
                        {kitchen === "pending" && (
                          <button type="button" className="admin-btn-primary" onClick={() => updateKitchen(o._id, "cooking")}>
                            Start Cooking
                          </button>
                        )}
                        {kitchen === "cooking" && (
                          <button type="button" className="admin-btn-primary" onClick={() => updateKitchen(o._id, "ready")}>
                            Mark Ready
                          </button>
                        )}
                        {kitchen === "ready" && !o.assignedDeliveryUserId && (
                          <>
                            <select
                              className="admin-select"
                              value={assignTo[o._id] || ""}
                              onChange={(e) => setAssignTo((p) => ({ ...p, [o._id]: e.target.value }))}
                            >
                              <option value="">Select delivery</option>
                              {deliveryStaff.map((u) => (
                                <option key={u._id} value={u._id}>{u.name} ({u.phone || u.email})</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="admin-btn-primary"
                              onClick={() => assignDelivery(o._id)}
                              disabled={!assignTo[o._id]}
                            >
                              Assign
                            </button>
                          </>
                        )}
                        {kitchen === "ready" && o.assignedDeliveryUserId && (
                          <span className="admin-muted" style={{ fontWeight: 800 }}>
                            Assigned
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-empty-cell">No kitchen orders.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChefOrdersPage;


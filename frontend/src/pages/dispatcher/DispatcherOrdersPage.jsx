import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const statusBadge = (s) => `badge ${s}`;

const DispatcherOrdersPage = () => {
  const [items, setItems] = useState([]);
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [assignTo, setAssignTo] = useState({});
  const [tab, setTab] = useState("ready");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    const params = new URLSearchParams();
    params.set("limit", "50");
    if (tab !== "all") params.set("status", tab);
    if (search.trim()) params.set("search", search.trim());
    return apiRequest(`/orders?${params.toString()}`)
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  };

  const loadStaff = () =>
    apiRequest("/delivery-staff?isBlocked=false&limit=200")
      .then((d) => setDeliveryStaff(d.items || []))
      .catch(() => setDeliveryStaff([]));

  useEffect(() => {
    const t = setTimeout(() => load(), 200);
    return () => clearTimeout(t);
  }, [tab, search]);

  useEffect(() => {
    loadStaff();
  }, []);

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
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Delivery Orders</h1>
          <p className="admin-subtitle">Assign delivery staff and monitor delivery statuses.</p>
        </div>
        <div className="admin-actions">
          <div className="admin-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              className="admin-input"
              placeholder="Search order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="button" className="admin-btn-secondary" onClick={() => { load(); loadStaff(); }}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-tabs">
        <button type="button" className={`admin-tab${tab === "ready" ? " active" : ""}`} onClick={() => setTab("ready")}>Ready</button>
        <button type="button" className={`admin-tab${tab === "assigned" ? " active" : ""}`} onClick={() => setTab("assigned")}>Assigned</button>
        <button type="button" className={`admin-tab${tab === "out_for_delivery" ? " active" : ""}`} onClick={() => setTab("out_for_delivery")}>Out for Delivery</button>
        <button type="button" className={`admin-tab${tab === "delivered" ? " active" : ""}`} onClick={() => setTab("delivered")}>Delivered</button>
        <button type="button" className={`admin-tab${tab === "failed" ? " active" : ""}`} onClick={() => setTab("failed")}>Failed</button>
        <button type="button" className={`admin-tab${tab === "cancelled" ? " active" : ""}`} onClick={() => setTab("cancelled")}>Cancelled</button>
        <button type="button" className={`admin-tab${tab === "all" ? " active" : ""}`} onClick={() => setTab("all")}>All</button>
      </div>

      <div className="admin-surface">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Total</th>
                <th>Address</th>
                <th style={{ width: 380 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o._id}>
                  <td style={{ fontWeight: 950 }}>{o.orderNumber}</td>
                  <td><span className={statusBadge(o.status)}>{o.status}</span></td>
                  <td>${Number(o.total || 0).toFixed(2)}</td>
                  <td className="admin-muted">{o.deliveryAddress?.district}, {o.deliveryAddress?.street}</td>
                  <td>
                    {o.status === "ready" && !o.assignedDeliveryUserId ? (
                      <div className="admin-row-actions">
                        <select
                          className="admin-select"
                          value={assignTo[o._id] || ""}
                          onChange={(e) => setAssignTo((p) => ({ ...p, [o._id]: e.target.value }))}
                        >
                          <option value="">Select delivery...</option>
                          {deliveryStaff.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name} ({u.staff?.availabilityStatus || "offline"})
                            </option>
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
                      </div>
                    ) : (
                      <div className="admin-muted" style={{ fontWeight: 800 }}>
                        {o.assignedDeliveryUserId ? "Assigned" : "-"}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty-cell">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DispatcherOrdersPage;


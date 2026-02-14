import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const statusClass = (status) => `badge ${status}`;
const statuses = ["pending", "preparing", "ready", "assigned", "out_for_delivery", "delivered", "failed", "cancelled", "on_the_way"];
const flow = ["pending", "preparing", "ready", "assigned", "out_for_delivery", "delivered"];
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api").replace(/\/+$/, "");

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [nextStatus, setNextStatus] = useState("");
  const [deliveryUsers, setDeliveryUsers] = useState([]);
  const [deliveryUserId, setDeliveryUserId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const load = () =>
    apiRequest(`/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch(() => setOrder(null));

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (order?.status) setNextStatus(order.status);
    if (order?.assignedDeliveryUserId) setDeliveryUserId(String(order.assignedDeliveryUserId));
  }, [order?.assignedDeliveryUserId, order?.status]);

  const timeline = useMemo(() => {
    const raw = order?.status || "pending";
    const current = raw === "on_the_way" ? "out_for_delivery" : raw;
    const isCancelled = raw === "cancelled";
    const isFailed = raw === "failed";
    const effective = isFailed ? "out_for_delivery" : current;
    const idx = flow.indexOf(effective);

    const base = flow.map((s, i) => ({
      key: s,
      label: s.replaceAll("_", " "),
      state: isCancelled || isFailed
        ? "upcoming"
        : i < idx
          ? "done"
          : i === idx
            ? "current"
            : "upcoming",
    }));

    if (isCancelled) return base.concat([{ key: "cancelled", label: "cancelled", state: "current" }]);
    if (isFailed) return base.concat([{ key: "failed", label: "failed", state: "current" }]);
    return base;
  }, [order?.status]);

  const updateStatus = async () => {
    setError("");
    setSaving(true);
    try {
      await apiRequest(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    apiRequest("/users?role=delivery&limit=200")
      .then((d) => setDeliveryUsers(d.items || []))
      .catch(() => setDeliveryUsers([]));
  }, []);

  const assignDelivery = async () => {
    setError("");
    setAssigning(true);
    try {
      await apiRequest(`/orders/${id}/assign-delivery`, {
        method: "PATCH",
        body: JSON.stringify({ deliveryUserId }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  if (!order) {
    return (
      <div className="admin-page">
        <div className="admin-surface admin-muted">Loading order...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{order.orderNumber}</h1>
          <p className="admin-subtitle">
            Status: <span className={statusClass(order.status)}>{order.status}</span>
          </p>
        </div>
        <div className="admin-actions">
          <Link className="admin-link" to="/admin/orders">Back to Orders</Link>
          <a className="admin-btn-link" href={`${API_BASE}/orders/${order._id}/invoice`} target="_blank" rel="noreferrer">
            <i className="fa-solid fa-file-invoice" /> Invoice
          </a>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-two-col">
        <div className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Customer</h3>
            <p className="admin-surface-subtitle">Delivery details and contact.</p>
          </div>
          <div className="admin-kv">
            <div>
              <div className="admin-muted">Name</div>
              <div className="admin-kv-strong">{order.customer?.name || "Customer"}</div>
            </div>
            <div>
              <div className="admin-muted">Phone</div>
              <div className="admin-kv-strong">{order.customer?.phone || "-"}</div>
            </div>
            <div>
              <div className="admin-muted">Address</div>
              <div className="admin-kv-strong">
                {order.deliveryAddress?.city}, {order.deliveryAddress?.district}, {order.deliveryAddress?.street}
              </div>
              {order.deliveryAddress?.notes && <div className="admin-muted">{order.deliveryAddress.notes}</div>}
            </div>
          </div>

          <div className="admin-divider" />

          <div className="admin-form-row">
            <div>
              <div className="admin-label" style={{ marginBottom: 2 }}>Assign delivery</div>
              <div className="admin-muted">Pick a delivery staff member for this order.</div>
            </div>
            <div className="admin-inline">
              <select className="admin-select" value={deliveryUserId} onChange={(e) => setDeliveryUserId(e.target.value)}>
                <option value="">Select delivery</option>
                {deliveryUsers.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={assignDelivery}
                disabled={!deliveryUserId || assigning}
              >
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>

          <div className="admin-divider" />

          <div className="admin-form-row">
            <div>
              <div className="admin-label" style={{ marginBottom: 2 }}>Update status</div>
              <div className="admin-muted">Changes are saved immediately.</div>
            </div>
            <div className="admin-inline">
              <select className="admin-select" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="button" className="admin-btn-primary" onClick={updateStatus} disabled={saving}>
                {saving ? "Updating..." : "Update"}
              </button>
            </div>
          </div>

          <div className="admin-timeline">
            {timeline.map((t) => (
              <div key={t.key} className={`admin-step ${t.state}`}>
                <span className="admin-step-dot" aria-hidden="true" />
                <div className="admin-step-label">{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Items</h3>
            <p className="admin-surface-subtitle">
              Subtotal ${Number(order.subtotal || 0).toFixed(2)} + Delivery ${Number(order.deliveryFee || 0).toFixed(2)} =
              <span style={{ fontWeight: 900 }}> ${Number(order.total || 0).toFixed(2)}</span>
              <span className="admin-muted" style={{ marginLeft: 10 }}>
                Payment: {order.paymentMethod} ({order.paymentStatus})
              </span>
            </p>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-striped">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={`${i.productId}-${i.title}`}>
                    <td style={{ fontWeight: 800 }}>{i.title}</td>
                    <td>{i.qty}</td>
                    <td>${Number(i.price || 0).toFixed(2)}</td>
                    <td>${(Number(i.price || 0) * Number(i.qty || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;

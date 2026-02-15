import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import { openInvoice } from "../../lib/invoice";

const statusClass = (status) => `badge ${status}`;
const statuses = ["awaiting_payment", "pending_verification", "pending", "preparing", "ready", "assigned", "out_for_delivery", "delivered", "failed", "cancelled", "on_the_way"];
const flow = ["pending", "preparing", "ready", "assigned", "out_for_delivery", "delivered"];

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [nextStatus, setNextStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    apiRequest(`/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch(() => setOrder(null));

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (order?.status) setNextStatus(order.status);
  }, [order?.status]);

  const timeline = useMemo(() => {
    const raw = order?.status || "pending";
    const normalized = raw === "awaiting_payment" || raw === "pending_verification" ? "pending" : raw;
    const current = normalized === "on_the_way" ? "out_for_delivery" : normalized;
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
          <button
            type="button"
            className="admin-btn-link"
            onClick={async () => {
              setError("");
              try {
                await openInvoice(order._id);
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <i className="fa-solid fa-file-invoice" /> Invoice
          </button>
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
              <div className="admin-label" style={{ marginBottom: 2 }}>Delivery assignment</div>
              <div className="admin-muted">Handled by Dispatcher.</div>
            </div>
            <div className="admin-muted" style={{ fontWeight: 900 }}>
              {order.assignedDeliveryUserId ? "Assigned" : "Not assigned"}
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

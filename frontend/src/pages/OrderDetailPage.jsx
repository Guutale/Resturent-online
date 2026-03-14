import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { openInvoice } from "../lib/invoice";

const statusClass = (status) => `badge ${status}`;
const PAY_TO_NUMBER = "252612527767";
const PAY_USSD = "*770#";

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [txRef, setTxRef] = useState("");
  const [proof, setProof] = useState("");
  const [proofName, setProofName] = useState("");
  const [confirming, setConfirming] = useState(false);

  const onPickProof = (file) => {
    setError("");
    setProof("");
    setProofName("");

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Screenshot must be an image file");
      return;
    }

    const maxBytes = 450 * 1024;
    if (file.size > maxBytes) {
      setError("Screenshot is too large. Please enter the transaction reference instead.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofName(file.name);
      setProof(String(reader.result || ""));
    };
    reader.onerror = () => setError("Failed to read screenshot");
    reader.readAsDataURL(file);
  };

  const confirmPayment = async () => {
    setConfirming(true);
    setError("");
    try {
      if (!order?._id) throw new Error("Missing order id");
      if (!txRef.trim() && !proof) throw new Error("Enter transaction reference or upload a screenshot");

      await apiRequest(`/orders/${order._id}/confirm-payment`, {
        method: "PATCH",
        body: JSON.stringify({
          transactionReference: txRef.trim() || undefined,
          proofImageUrl: proof || undefined,
        }),
      });

      const data = await apiRequest(`/orders/${order._id}`);
      setOrder(data.order);
      setTxRef("");
      setProof("");
      setProofName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    setLoading(true);

    apiRequest(`/orders/${id}`)
      .then((data) => {
        if (!isMounted) return;
        setOrder(data.order);
      })
      .catch(() => {
        if (!isMounted) return;
        setOrder(null);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="page order-detail-page">
        <div className="panel loading-card">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page order-detail-page">
        <section className="panel empty-state">
          <span className="empty-state-icon">
            <i className="fa-solid fa-receipt" />
          </span>
          <h1 className="page-title">Order not found</h1>
          <p className="muted">This order could not be loaded.</p>
        </section>
      </div>
    );
  }

  const needsPayment = order.paymentMethod !== "COD" && order.paymentStatus !== "paid";
  const statusHistory = Array.isArray(order.statusHistory) ? [...order.statusHistory].reverse() : [];

  return (
    <div className="page order-detail-page">
      <section className="panel order-detail-hero">
        <div>
          <p className="section-kicker">Order detail</p>
          <h1 className="page-title">{order.orderNumber}</h1>
          <p className="muted">
            Review items, payment state, delivery address, and the latest status history in one place.
          </p>
        </div>

        <div className="order-detail-badges">
          <span className={statusClass(order.status)}>{order.status.replaceAll("_", " ")}</span>
          <span className={`badge pay-${order.paymentStatus}`}>{order.paymentStatus}</span>
        </div>
      </section>

      {error && <div className="form-alert error">{error}</div>}

      <section className="order-detail-shell">
        <article className="panel order-detail-main">
          <div className="order-detail-grid">
            <div className="detail-meta-card">
              <span className="detail-meta-label">Total</span>
              <strong>${Number(order.total || 0).toFixed(2)}</strong>
            </div>
            <div className="detail-meta-card">
              <span className="detail-meta-label">Payment method</span>
              <strong>{order.paymentMethod}</strong>
            </div>
            <div className="detail-meta-card">
              <span className="detail-meta-label">Placed on</span>
              <strong>{new Date(order.createdAt).toLocaleString()}</strong>
            </div>
          </div>

          <div className="order-section">
            <div className="section-head">
              <div>
                <p className="section-kicker">Items</p>
                <h2 className="page-title">Order contents</h2>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={async () => {
                  setError("");
                  try {
                    await openInvoice(order._id);
                  } catch (err) {
                    setError(err.message);
                  }
                }}
              >
                <i className="fa-solid fa-file-invoice" />
                View invoice
              </button>
            </div>

            <div className="order-item-list">
              {order.items.map((item) => (
                <article key={item.productId} className="order-item-card">
                  <div className="order-item-media">
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=1200"}
                      alt={item.title}
                    />
                  </div>
                  <div className="order-item-copy">
                    <strong>{item.title}</strong>
                    <span className="muted">Qty {item.qty}</span>
                  </div>
                  <div className="order-item-price">
                    <span>${Number(item.price || 0).toFixed(2)} each</span>
                    <strong>${(Number(item.price || 0) * Number(item.qty || 0)).toFixed(2)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {needsPayment && (
            <div className="panel order-payment-panel">
              <div className="checkout-payment-head">
                <div>
                  <p className="section-kicker">Payment required</p>
                  <h2 className="page-title">Finish payment for this order.</h2>
                </div>
                <div className="checkout-payment-amount">
                  <span>Amount due</span>
                  <strong>${Number(order.total || 0).toFixed(2)}</strong>
                </div>
              </div>

              <div className="checkout-pay-grid">
                <div className="checkout-pay-box">
                  <span className="detail-meta-label">Pay to number</span>
                  <strong>{PAY_TO_NUMBER}</strong>
                  <p className="muted">Use {PAY_USSD} and keep the order number ready.</p>
                </div>
                <div className="checkout-pay-box">
                  <span className="detail-meta-label">Current state</span>
                  <strong>{order.paymentStatus}</strong>
                  <p className="muted">
                    {order.paymentStatus === "pending"
                      ? "Payment submitted and waiting for verification."
                      : "Submit a transaction reference or screenshot after payment."}
                  </p>
                </div>
              </div>

              <label className="field-block">
                <span>Transaction reference</span>
                <input
                  placeholder="Optional if you upload a screenshot"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                />
              </label>

              <label className="field-block">
                <span>Upload screenshot</span>
                <input type="file" accept="image/*" onChange={(e) => onPickProof(e.target.files?.[0])} />
              </label>

              {proof && (
                <div className="proof-preview-card">
                  <div className="proof-preview-head">
                    <strong>{proofName || "Payment screenshot"}</strong>
                    <span className="muted">Preview before submission</span>
                  </div>
                  <img src={proof} alt="Payment proof preview" className="proof-preview-image" />
                </div>
              )}

              <div className="checkout-action-row">
                <button type="button" onClick={confirmPayment} disabled={confirming}>
                  <i className="fa-solid fa-check" />
                  {confirming ? "Submitting..." : "Confirm payment"}
                </button>
              </div>
            </div>
          )}
        </article>

        <aside className="panel order-detail-sidebar">
          <div className="summary-card-head">
            <p className="section-kicker">Delivery</p>
            <h2 className="page-title">Address and contact</h2>
          </div>

          <div className="summary-note">
            <i className="fa-solid fa-user" />
            <span>{order.customer?.name || "Customer"}</span>
          </div>
          <div className="summary-note">
            <i className="fa-solid fa-phone" />
            <span>{order.customer?.phone || "No phone"}</span>
          </div>
          <div className="summary-note">
            <i className="fa-solid fa-location-dot" />
            <span>
              {order.deliveryAddress?.city}, {order.deliveryAddress?.district}, {order.deliveryAddress?.street}
            </span>
          </div>

          {order.deliveryAddress?.notes && (
            <div className="detail-note-card">
              <span className="section-kicker">Delivery note</span>
              <strong>{order.deliveryAddress.notes}</strong>
            </div>
          )}

          <div className="summary-card-head order-timeline-head">
            <p className="section-kicker">Timeline</p>
            <h2 className="page-title">Status history</h2>
          </div>

          <div className="order-timeline">
            {statusHistory.length === 0 ? (
              <p className="muted">No status history available.</p>
            ) : (
              statusHistory.map((entry, index) => (
                <div key={`${entry.status}-${entry.at}-${index}`} className="order-timeline-item">
                  <span className={`order-timeline-dot ${index === 0 ? "is-current" : ""}`} />
                  <div>
                    <strong>{entry.status.replaceAll("_", " ")}</strong>
                    <span>{new Date(entry.at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>
    </div>
  );
};

export default OrderDetailPage;

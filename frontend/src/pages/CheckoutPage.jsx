import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useCart } from "../context/CartContext";

const PAY_TO_NUMBER = "252612527767";
const PAY_USSD = "*770#";
const DELIVERY_FEE = 1;

const CheckoutPage = () => {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState("details");
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({
    city: "Mogadishu",
    district: "Hodan",
    street: "",
    notes: "",
    phone: "",
    customerName: "",
  });

  const [txRef, setTxRef] = useState("");
  const [proof, setProof] = useState("");
  const [proofName, setProofName] = useState("");

  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const previewSubtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0);
  const previewDeliveryFee = order?.deliveryFee ?? DELIVERY_FEE;
  const previewTotal = order?.total ?? (previewSubtotal + previewDeliveryFee);
  const previewOrderNumber = order?.orderNumber || "Pending";
  const addressLabel = [form.city, form.district, form.street].filter(Boolean).join(", ");

  const createOrder = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      if (items.length === 0) throw new Error("Cart is empty");
      if (!form.phone.trim()) throw new Error("Phone is required");
      if (!form.street.trim()) throw new Error("Street is required");

      const data = await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((x) => ({ productId: x.productId, qty: x.qty })),
          deliveryAddress: { city: form.city, district: form.district, street: form.street, notes: form.notes },
          phone: form.phone,
          paymentMethod: "EVCPLUS",
          customerName: form.customerName,
        }),
      });

      setOrder(data);
      clearCart();
      setStep("confirm");
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

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
      if (!order?.orderId) throw new Error("Order not created yet");
      if (!txRef.trim() && !proof) throw new Error("Enter transaction reference or upload a screenshot");

      await apiRequest(`/orders/${order.orderId}/confirm-payment`, {
        method: "PATCH",
        body: JSON.stringify({
          transactionReference: txRef.trim() || undefined,
          proofImageUrl: proof || undefined,
        }),
      });

      navigate(`/orders/${order.orderId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  if (items.length === 0 && !order) {
    return (
      <div className="page checkout-page">
        <section className="panel empty-state">
          <span className="empty-state-icon">
            <i className="fa-solid fa-credit-card" />
          </span>
          <p className="section-kicker">Checkout</p>
          <h1 className="page-title">There is nothing to check out yet.</h1>
          <p className="muted">
            Add dishes to the cart first, then return here to confirm delivery details and payment.
          </p>
          <Link to="/menu" className="btn">Browse menu</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page checkout-page">
      <section className="checkout-shell">
        <article className="panel checkout-main-panel">
          <div className="section-head">
            <div>
              <p className="section-kicker">Checkout</p>
              <h1 className="page-title">Delivery details first, payment confirmation second.</h1>
            </div>

            <div className="checkout-steps">
              <span className={`checkout-step ${step === "details" ? "is-active" : "is-complete"}`}>1. Details</span>
              <span className={`checkout-step ${step === "confirm" ? "is-active" : ""}`}>2. Payment</span>
            </div>
          </div>

          {error && <div className="form-alert error">{error}</div>}

          {step === "details" && (
            <form className="checkout-form" onSubmit={createOrder}>
              <div className="input-row">
                <label className="field-block">
                  <span>Full name</span>
                  <input
                    placeholder="Full name"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  />
                </label>
                <label className="field-block">
                  <span>Phone</span>
                  <input
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </label>
                <label className="field-block">
                  <span>City</span>
                  <input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </label>
              </div>

              <div className="input-row">
                <label className="field-block">
                  <span>District</span>
                  <input
                    placeholder="District"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                  />
                </label>
                <label className="field-block">
                  <span>Street</span>
                  <input
                    placeholder="Street"
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                  />
                </label>
                <label className="field-block">
                  <span>Notes</span>
                  <textarea
                    placeholder="Landmark, gate color, or extra delivery note"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </label>
              </div>

              <div className="checkout-helper-row">
                <div className="summary-note">
                  <i className="fa-solid fa-mobile-screen-button" />
                  <span>EVC Plus payment instructions will appear immediately after the order is created.</span>
                </div>

                <button type="submit" disabled={creating || items.length === 0}>
                  <i className="fa-solid fa-arrow-right" />
                  {creating ? "Creating order..." : "Continue to payment"}
                </button>
              </div>
            </form>
          )}

          {step === "confirm" && order && (
            <div className="checkout-confirm-grid">
              <section className="checkout-payment-card">
                <div className="checkout-payment-head">
                  <div>
                    <p className="section-kicker">Payment instructions</p>
                    <h2 className="page-title">Send the payment, then confirm it here.</h2>
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
                    <p className="muted">Dial {PAY_USSD} and send the exact order amount.</p>
                  </div>
                  <div className="checkout-pay-box">
                    <span className="detail-meta-label">Order reference</span>
                    <strong>{order.orderNumber}</strong>
                    <p className="muted">Keep this order number nearby while you confirm payment.</p>
                  </div>
                </div>
              </section>

              <section className="checkout-proof-card">
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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickProof(e.target.files?.[0])}
                  />
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
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => navigate(`/orders/${order.orderId}`)}
                    disabled={confirming}
                  >
                    View order first
                  </button>
                  <button type="button" onClick={confirmPayment} disabled={confirming}>
                    <i className="fa-solid fa-check" />
                    {confirming ? "Submitting..." : "Confirm payment"}
                  </button>
                </div>
              </section>
            </div>
          )}
        </article>

        <aside className="panel checkout-sidebar">
          <div className="summary-card-head">
            <p className="section-kicker">Order summary</p>
            <h2 className="page-title">Snapshot</h2>
          </div>

          <div className="checkout-order-id">
            <span>Order</span>
            <strong>{previewOrderNumber}</strong>
          </div>

          <div className="checkout-summary-list">
            {step === "details" && items.map((item) => (
              <div key={item.productId} className="checkout-summary-line">
                <span>{item.title} x{item.qty}</span>
                <strong>${(Number(item.price || 0) * item.qty).toFixed(2)}</strong>
              </div>
            ))}

            <div className="summary-line">
              <span>Subtotal</span>
              <strong>${Number(step === "confirm" ? order?.subtotal : previewSubtotal).toFixed(2)}</strong>
            </div>
            <div className="summary-line">
              <span>Delivery</span>
              <strong>${Number(previewDeliveryFee).toFixed(2)}</strong>
            </div>
            <div className="summary-line summary-line-total">
              <span>Total</span>
              <strong>${Number(previewTotal).toFixed(2)}</strong>
            </div>
          </div>

          <div className="summary-note">
            <i className="fa-solid fa-location-dot" />
            <span>{addressLabel || "Delivery address pending"}</span>
          </div>

          <div className="summary-note">
            <i className="fa-solid fa-phone" />
            <span>{form.phone || "Phone number pending"}</span>
          </div>

          <Link className="btn-outline summary-cta" to="/cart">
            <i className="fa-solid fa-pen" />
            Edit cart
          </Link>
        </aside>
      </section>
    </div>
  );
};

export default CheckoutPage;

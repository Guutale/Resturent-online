import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useCart } from "../context/CartContext";

const PAY_TO_NUMBER = "252612527767";
const PAY_USSD = "*770#";

const CheckoutPage = () => {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState("details"); // details | confirm
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

    // Keep this reasonably small since it's stored directly in MongoDB as a string.
    const maxBytes = 450 * 1024; // 450KB
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
      <div className="page panel">
        <h2 className="page-title"><i className="fa-solid fa-credit-card" /> Checkout</h2>
        <p className="muted">
          Your cart is empty. <Link to="/menu" className="auth-link">Browse menu</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page panel">
      <h2 className="page-title"><i className="fa-solid fa-credit-card" /> Checkout</h2>
      {error && <p style={{ color: "#dc2626", fontWeight: 700 }}>{error}</p>}

      {step === "details" && (
        <form onSubmit={createOrder}>
          <div className="input-row" style={{ marginBottom: "0.7rem" }}>
            <input placeholder="Full name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>

          <div className="input-row" style={{ marginBottom: "0.7rem" }}>
            <input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <input placeholder="Street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <button disabled={creating || items.length === 0}>
            {creating ? "Creating order..." : "Continue to Payment"}
          </button>
        </form>
      )}

      {step === "confirm" && order && (
        <div style={{ display: "grid", gap: 12 }}>
          <div className="panel" style={{ boxShadow: "none", borderStyle: "dashed" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 950, fontSize: 16 }}>Pay To Number</div>
                <div style={{ fontWeight: 950, fontSize: 22, marginTop: 4 }}>{PAY_TO_NUMBER}</div>
                <div className="muted" style={{ marginTop: 6 }}>
                  Send money via <strong>{PAY_USSD}</strong>, then confirm below.
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="muted" style={{ fontWeight: 800 }}>Amount</div>
                <div style={{ fontWeight: 950, fontSize: 22 }}>${Number(order.total || 0).toFixed(2)}</div>
                <div className="muted" style={{ marginTop: 8, fontWeight: 800 }}>Order ID</div>
                <div style={{ fontWeight: 950 }}>{order.orderNumber}</div>
              </div>
            </div>
          </div>

          <div className="input-row" style={{ marginBottom: "0.7rem" }}>
            <input
              placeholder="Transaction reference (optional if you upload screenshot)"
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
            />
            <div />
            <div />
          </div>

          <div className="panel" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 950 }}>Upload Screenshot (Optional)</div>
            <div className="muted" style={{ marginTop: 4 }}>You can upload screenshot OR just enter the transaction reference.</div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPickProof(e.target.files?.[0])}
              style={{ marginTop: 10 }}
            />
            {proof && (
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <div className="muted" style={{ fontWeight: 700 }}>Selected: {proofName || "screenshot"}</div>
                <img src={proof} alt="Payment proof preview" style={{ width: "100%", maxWidth: 520, borderRadius: 12, border: "1px solid #e5e7eb" }} />
              </div>
            )}
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate(`/orders/${order.orderId}`)}
              disabled={confirming}
            >
              Skip (view order)
            </button>
            <button type="button" onClick={confirmPayment} disabled={confirming}>
              {confirming ? "Submitting..." : "Confirm Payment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;

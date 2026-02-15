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
      if (!order?._id) throw new Error("Missing order id");
      if (!txRef.trim() && !proof) throw new Error("Enter transaction reference or upload a screenshot");

      await apiRequest(`/orders/${order._id}/confirm-payment`, {
        method: "PATCH",
        body: JSON.stringify({
          transactionReference: txRef.trim() || undefined,
          proofImageUrl: proof || undefined,
        }),
      });

      const d = await apiRequest(`/orders/${order._id}`);
      setOrder(d.order);
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
    apiRequest(`/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch(() => setOrder(null));
  }, [id]);

  if (!order) return <div className="page"><div className="panel muted">Loading order...</div></div>;

  return (
    <div className="page panel">
      <h2 className="page-title"><i className="fa-solid fa-receipt" /> {order.orderNumber}</h2>
      {error && <p style={{ color: "#dc2626", fontWeight: 700 }}>{error}</p>}
      <p>Status: <span className={statusClass(order.status)}>{order.status}</span></p>
      <p>
        Payment: <strong>{order.paymentMethod}</strong>{" "}
        <span className={`badge pay-${order.paymentStatus}`} style={{ marginLeft: 8 }}>{order.paymentStatus}</span>
      </p>
      <p>Total: ${order.total}</p>

      {order.paymentMethod !== "COD" && order.paymentStatus !== "paid" && (
        <div className="panel" style={{ marginTop: 10, boxShadow: "none", borderStyle: "dashed" }}>
          <div style={{ fontWeight: 950 }}>Payment Required</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Pay to <strong>{PAY_TO_NUMBER}</strong> using <strong>{PAY_USSD}</strong>, then confirm payment.
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            Amount: <strong>${Number(order.total || 0).toFixed(2)}</strong> · Order ID: <strong>{order.orderNumber}</strong>
          </div>

          <div className="input-row" style={{ marginTop: 10, marginBottom: 0 }}>
            <input
              placeholder="Transaction reference (optional if you upload screenshot)"
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
            />
            <div />
            <div />
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 900 }}>Upload Screenshot (Optional)</div>
            <input type="file" accept="image/*" onChange={(e) => onPickProof(e.target.files?.[0])} style={{ marginTop: 8 }} />
            {proof && (
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <div className="muted" style={{ fontWeight: 700 }}>Selected: {proofName || "screenshot"}</div>
                <img src={proof} alt="Payment proof preview" style={{ width: "100%", maxWidth: 520, borderRadius: 12, border: "1px solid #e5e7eb" }} />
              </div>
            )}
          </div>

          <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={confirmPayment} disabled={confirming}>
              {confirming ? "Submitting..." : "Confirm Payment"}
            </button>
          </div>

          {order.paymentStatus === "pending" && (
            <div className="muted" style={{ marginTop: 8, fontWeight: 800 }}>
              Status: Pending verification (admin will approve).
            </div>
          )}
        </div>
      )}

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
        View invoice
      </button>
      <h3>Items</h3>
      {order.items.map((i) => (
        <p key={i.productId}>{i.title} x{i.qty} - ${i.price}</p>
      ))}
      <h3>Address</h3>
      <p>{order.deliveryAddress.city}, {order.deliveryAddress.district}, {order.deliveryAddress.street}</p>
    </div>
  );
};

export default OrderDetailPage;

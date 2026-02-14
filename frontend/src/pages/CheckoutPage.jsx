import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useCart } from "../context/CartContext";

const CheckoutPage = () => {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ city: "Mogadishu", district: "Hodan", street: "", notes: "", phone: "", customerName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((x) => ({ productId: x.productId, qty: x.qty })),
          deliveryAddress: { city: form.city, district: form.district, street: form.street, notes: form.notes },
          phone: form.phone,
          paymentMethod: "COD",
          customerName: form.customerName,
        }),
      });

      clearCart();
      navigate(`/orders/${data.orderId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="page panel" onSubmit={submit}>
      <h2 className="page-title"><i className="fa-solid fa-credit-card" /> Checkout</h2>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

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

      <button disabled={loading || items.length === 0}>{loading ? "Placing..." : "Place Order (COD)"}</button>
    </form>
  );
};

export default CheckoutPage;

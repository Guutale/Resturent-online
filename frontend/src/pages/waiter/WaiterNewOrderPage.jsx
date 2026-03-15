import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

const WaiterNewOrderPage = () => {
  const [tables, setTables] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");
  const [quantities, setQuantities] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiRequest("/tables?limit=200")
      .then((data) => setTables((data.items || []).filter((table) => table.isActive !== false)))
      .catch(() => setTables([]));

    apiRequest("/products?limit=100&sort=-createdAt")
      .then((data) => setProducts((data.items || []).filter((item) => item.isAvailable)))
      .catch(() => setProducts([]));
  }, []);

  const cartItems = useMemo(
    () => products
      .filter((product) => Number(quantities[product._id] || 0) > 0)
      .map((product) => ({ ...product, qty: Number(quantities[product._id] || 0) })),
    [products, quantities]
  );

  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0),
    [cartItems]
  );

  const updateQty = (productId, delta) => {
    setQuantities((current) => {
      const next = Math.max(0, Number(current[productId] || 0) + delta);
      return { ...current, [productId]: next };
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      await apiRequest("/orders/waiter", {
        method: "POST",
        body: JSON.stringify({
          tableId: selectedTable,
          customerName,
          phone,
          serviceNotes,
          items: cartItems.map((item) => ({ productId: item._id, qty: item.qty })),
        }),
      });
      setQuantities({});
      setCustomerName("");
      setPhone("");
      setServiceNotes("");
      setMessage("Dine-in order created and sent to the kitchen.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">New Order</h1>
          <p className="admin-subtitle">Create a dine-in order, select a table, and send the meal to the kitchen queue.</p>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}
      {message && <div className="admin-alert dashboard-success-alert">{message}</div>}

      <form className="admin-two-col" onSubmit={submit}>
        <section className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Order Details</h3>
            <p className="admin-surface-subtitle">Assign the order to a table and capture service notes.</p>
          </div>

          <div className="admin-form">
            <div>
              <label className="admin-label">Table</label>
              <select className="admin-select" value={selectedTable} onChange={(event) => setSelectedTable(event.target.value)}>
                <option value="">Select table...</option>
                {tables.map((table) => (
                  <option key={table._id} value={table._id}>
                    {table.name} ({table.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-2col">
              <div>
                <label className="admin-label">Customer Name</label>
                <input className="admin-input" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Optional walk-in name" />
              </div>
              <div>
                <label className="admin-label">Phone</label>
                <input className="admin-input" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional phone number" />
              </div>
            </div>

            <div>
              <label className="admin-label">Service Notes</label>
              <textarea className="admin-input" rows={4} value={serviceNotes} onChange={(event) => setServiceNotes(event.target.value)} placeholder="Allergies, table requests, special instructions..." />
            </div>
          </div>
        </section>

        <section className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Selected Items</h3>
            <p className="admin-surface-subtitle">Review the live order before sending it.</p>
          </div>
          <div className="dashboard-order-summary">
            {cartItems.map((item) => (
              <div key={item._id} className="dashboard-order-line">
                <span>{item.title} x{item.qty}</span>
                <strong>${(Number(item.price || 0) * item.qty).toFixed(2)}</strong>
              </div>
            ))}
            {cartItems.length === 0 && <div className="admin-muted">Add items from the menu below.</div>}
          </div>
          <div className="dashboard-order-total">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
          <div className="admin-modal-actions" style={{ justifyContent: "flex-start" }}>
            <button type="submit" className="admin-btn-primary" disabled={saving || !selectedTable || cartItems.length === 0}>
              {saving ? "Sending..." : "Send to kitchen"}
            </button>
          </div>
        </section>
      </form>

      <section className="admin-page" style={{ marginTop: "1.25rem" }}>
        <div className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Menu Items</h3>
            <p className="admin-surface-subtitle">Tap items to add them to the active table order.</p>
          </div>
          <div className="dashboard-food-grid">
            {products.map((product) => (
              <article key={product._id} className="dashboard-food-card">
                <img src={product.imageUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?w=900"} alt={product.title} />
                <div className="dashboard-food-body">
                  <div className="dashboard-food-head">
                    <strong>{product.title}</strong>
                    <span>${Number(product.price || 0).toFixed(2)}</span>
                  </div>
                  <p className="admin-muted">{product.categoryId?.name || "Menu item"}</p>
                  <div className="dashboard-food-actions">
                    <button type="button" className="admin-btn-secondary" onClick={() => updateQty(product._id, -1)}>-</button>
                    <span>{Number(quantities[product._id] || 0)}</span>
                    <button type="button" className="admin-btn-primary" onClick={() => updateQty(product._id, 1)}>+</button>
                  </div>
                </div>
              </article>
            ))}
            {products.length === 0 && (
              <div className="admin-empty-state">
                <div className="admin-empty-icon"><i className="fa-solid fa-burger" /></div>
                <div className="admin-empty-title">No available menu items</div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default WaiterNewOrderPage;

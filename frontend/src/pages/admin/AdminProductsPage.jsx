import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

const AdminProductsPage = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availability, setAvailability] = useState("all"); // all | available | out
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    price: "",
    categoryId: "",
    description: "",
    imageUrl: "",
    isAvailable: true,
    stockQty: "",
    lowStockThreshold: "5",
  });

  const load = () =>
    apiRequest("/products?limit=100&sort=-createdAt")
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));

  useEffect(() => {
    load();
    apiRequest("/categories/admin")
      .then((d) => setCategories(d.items || []))
      .catch(() => setCategories([]));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((p) => {
      const matchesQ = !needle
        || String(p.title || "").toLowerCase().includes(needle)
        || String(p.description || "").toLowerCase().includes(needle);

      const pCatId = String(p.categoryId?._id || p.categoryId || "");
      const matchesCat = !categoryFilter || pCatId === categoryFilter;

      const matchesAvail = availability === "all"
        || (availability === "available" && p.isAvailable)
        || (availability === "out" && !p.isAvailable);

      return matchesQ && matchesCat && matchesAvail;
    });
  }, [availability, categoryFilter, items, q]);

  const openCreate = () => {
    setError("");
    setEditing(null);
    setForm({
      title: "",
      price: "",
      categoryId: "",
      description: "",
      imageUrl: "",
      isAvailable: true,
      stockQty: "",
      lowStockThreshold: "5",
    });
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setError("");
    setEditing(product);
    setForm({
      title: product.title || "",
      price: String(product.price ?? ""),
      categoryId: String(product.categoryId?._id || product.categoryId || ""),
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      isAvailable: Boolean(product.isAvailable),
      stockQty: product.stockQty === undefined || product.stockQty === null ? "" : String(product.stockQty),
      lowStockThreshold: product.lowStockThreshold === undefined || product.lowStockThreshold === null ? "5" : String(product.lowStockThreshold),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const price = Number(form.price);
      if (!form.title.trim()) throw new Error("Title is required");
      if (!form.categoryId) throw new Error("Category is required");
      if (!Number.isFinite(price) || price < 0) throw new Error("Price must be a valid number");

      if (form.stockQty !== "") {
        const n = Number(form.stockQty);
        if (!Number.isInteger(n) || n < 0) throw new Error("Stock quantity must be a non-negative integer");
      }

      if (form.lowStockThreshold !== "") {
        const n = Number(form.lowStockThreshold);
        if (!Number.isInteger(n) || n < 0) throw new Error("Low stock threshold must be a non-negative integer");
      }

      const payload = {
        title: form.title,
        description: form.description,
        price,
        categoryId: form.categoryId,
        imageUrl: form.imageUrl,
        isAvailable: Boolean(form.isAvailable),
        stockQty: form.stockQty,
        lowStockThreshold: form.lowStockThreshold,
      };

      if (editing?._id) {
        await apiRequest(`/products/${editing._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id, isAvailable) => {
    setError("");
    try {
      await apiRequest(`/products/${id}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ isAvailable: !isAvailable }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const del = async (id) => {
    setError("");
    const ok = window.confirm("Delete this product?");
    if (!ok) return;
    try {
      await apiRequest(`/products/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Products</h1>
          <p className="admin-subtitle">Manage menu items, availability, and pricing.</p>
        </div>
        <div className="admin-actions">
          <div className="admin-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              className="admin-input"
              placeholder="Search products..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select className="admin-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <div className="admin-segment">
            <button type="button" className={`admin-segment-btn${availability === "all" ? " active" : ""}`} onClick={() => setAvailability("all")}>All</button>
            <button type="button" className={`admin-segment-btn${availability === "available" ? " active" : ""}`} onClick={() => setAvailability("available")}>Available</button>
            <button type="button" className={`admin-segment-btn${availability === "out" ? " active" : ""}`} onClick={() => setAvailability("out")}>Out</button>
          </div>
          <button type="button" className="admin-btn-primary" onClick={openCreate}>
            <i className="fa-solid fa-plus" /> Add Product
          </button>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-product-grid">
        {filtered.map((p) => (
          <article key={p._id} className="admin-product-card animate-fade-in">
            <div className="admin-product-image">
              <img
                src={p.imageUrl || "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=900"}
                alt={p.title}
                loading="lazy"
              />
              {(!p.isAvailable || (typeof p.stockQty === "number" && p.stockQty === 0)) && (
                <div className="admin-product-overlay">Out of stock</div>
              )}
            </div>
            <div className="admin-product-body">
              <div className="admin-product-title-row">
                <div className="admin-product-title">{p.title}</div>
                <div className="admin-product-price">${Number(p.price || 0).toFixed(2)}</div>
              </div>
              <div className="admin-product-meta">
                {p.categoryId?.name ? p.categoryId.name : "Uncategorized"}
                {typeof p.stockQty === "number" && (
                  <span className="admin-product-stock">Stock: {p.stockQty}</span>
                )}
              </div>
              <div className="admin-product-actions">
                <button type="button" className="admin-icon-btn" onClick={() => openEdit(p)} aria-label="Edit">
                  <i className="fa-solid fa-pen" />
                </button>
                <button type="button" className="admin-icon-btn" onClick={() => toggle(p._id, p.isAvailable)} aria-label="Toggle availability">
                  <i className={`fa-solid ${p.isAvailable ? "fa-eye" : "fa-eye-slash"}`} />
                </button>
                <button type="button" className="admin-icon-btn danger" onClick={() => del(p._id)} aria-label="Delete">
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><i className="fa-solid fa-box-open" /></div>
            <div className="admin-empty-title">No products found</div>
            <div className="admin-muted">Try a different search or filter.</div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="admin-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="admin-modal admin-modal-lg animate-scale-up" role="dialog" aria-modal="true">
            <div className="admin-modal-head row-between">
              <h3 className="admin-modal-title">{editing ? "Edit Product" : "New Product"}</h3>
              <button type="button" className="admin-icon-btn" onClick={closeModal} aria-label="Close">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form className="admin-form-grid" onSubmit={onSubmit}>
              <div className="admin-form-col">
                <label className="admin-label">Title</label>
                <input
                  className="admin-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Chicken Burger"
                />

                <div className="admin-form-2col">
                  <div>
                    <label className="admin-label">Price</label>
                    <input
                      className="admin-input"
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="6"
                    />
                  </div>
                  <div>
                    <label className="admin-label">Category</label>
                    <select
                      className="admin-select"
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-2col">
                  <div>
                    <label className="admin-label">Stock Qty</label>
                    <input
                      className="admin-input"
                      type="number"
                      value={form.stockQty}
                      onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                  <div>
                    <label className="admin-label">Low Stock Alert</label>
                    <input
                      className="admin-input"
                      type="number"
                      value={form.lowStockThreshold}
                      onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div>
                    <div className="admin-label" style={{ marginBottom: 2 }}>Availability</div>
                    <div className="admin-muted">Disable to show "Out of stock".</div>
                  </div>
                  <button
                    type="button"
                    className={`admin-switch${form.isAvailable ? " checked" : ""}`}
                    onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}
                    aria-pressed={form.isAvailable}
                  >
                    <span className="admin-switch-thumb" />
                  </button>
                </div>

                <label className="admin-label">Description</label>
                <textarea
                  className="admin-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Spicy, crispy, and served fresh..."
                  rows={5}
                />
              </div>

              <div className="admin-form-col">
                <div className="admin-upload">
                  <div className="admin-upload-preview">
                    <img
                      src={form.imageUrl || "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=900"}
                      alt="Preview"
                    />
                  </div>
                  <div className="admin-upload-body">
                    <div className="admin-upload-title">Product Image</div>
                    <div className="admin-muted">Use an image URL for v1.</div>
                    <input
                      className="admin-input"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https://..."
                      style={{ marginTop: 10 }}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal-actions admin-modal-actions-span">
                <button type="button" className="admin-btn-secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;

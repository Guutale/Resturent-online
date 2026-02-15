import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useCart } from "../context/CartContext";

const MenuPage = () => {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();

  const category = params.get("category") || "";
  const search = params.get("search") || "";
  const sort = params.get("sort") || "-createdAt";

  useEffect(() => {
    apiRequest("/categories")
      .then((d) => setCategories(d.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    if (search) qs.set("search", search);
    if (sort) qs.set("sort", sort);

    apiRequest(`/products?${qs.toString()}`)
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category, search, sort]);

  return (
    <div className="page">
      <h2 className="page-title"><i className="fa-solid fa-utensils" /> Menu</h2>
      <p className="muted" style={{ marginTop: "-0.45rem", marginBottom: "0.9rem" }}>
        Filter, search, and order with a clean restaurant-first design.
      </p>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <div className="input-row" style={{ marginBottom: 0 }}>
          <input
            placeholder="Search item"
            value={search}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              next.set("search", e.target.value);
              setParams(next);
            }}
          />

          <select
            value={category}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              if (e.target.value) next.set("category", e.target.value);
              else next.delete("category");
              setParams(next);
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              next.set("sort", e.target.value);
              setParams(next);
            }}
          >
            <option value="-createdAt">Newest</option>
            <option value="price">Price low-high</option>
            <option value="-price">Price high-low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="panel muted">Loading menu...</div>
      ) : (
        <div className="grid">
          {items.length === 0 && <div className="panel muted">No dishes found for this filter.</div>}
          {items.map((p) => {
            const outOfStock = !p.isAvailable || (typeof p.stockQty === "number" && p.stockQty === 0);
            return (
              <div className="card" key={p._id}>
              <img src={p.imageUrl || "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=800"} alt={p.title} />
              <div className="card-b">
                <div className="row-between" style={{ marginBottom: "0.4rem" }}>
                  <strong>{p.title}</strong>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <span className="status-chip">${p.price}</span>
                    {outOfStock && <span className="badge cancelled">Out of stock</span>}
                  </div>
                </div>
                <p className="muted">{p.description || "Fresh and delicious"}</p>
                <div className="row">
                  <button
                    disabled={outOfStock}
                    onClick={() => addToCart(p, 1)}
                  >
                    {outOfStock ? "Out of stock" : "Add"}
                  </button>
                  <Link className="btn-ghost" to={`/menu/${p._id}`}>Details</Link>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MenuPage;

import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useCart } from "../context/CartContext";

const ProductDetailPage = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError("");

    apiRequest(`/products/${id}`)
      .then((data) => {
        if (!isMounted) return;
        setItem(data.item);
      })
      .catch(() => {
        if (!isMounted) return;
        setItem(null);
        setError("We could not load this dish right now.");
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
      <div className="page detail-page">
        <div className="panel loading-card">Loading dish details...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page detail-page">
        <section className="panel empty-state">
          <span className="empty-state-icon">
            <i className="fa-solid fa-bowl-food" />
          </span>
          <h1 className="page-title">Dish unavailable</h1>
          <p className="muted">{error || "This dish could not be found."}</p>
          <Link className="btn" to="/menu">Back to menu</Link>
        </section>
      </div>
    );
  }

  const inStock = item.isAvailable && !(typeof item.stockQty === "number" && item.stockQty === 0);
  const lowStock =
    inStock
    && typeof item.stockQty === "number"
    && typeof item.lowStockThreshold === "number"
    && item.stockQty <= item.lowStockThreshold;
  const categoryName = item.categoryId?.name || "Kitchen pick";
  const tags = Array.isArray(item.tags) ? item.tags.slice(0, 4) : [];
  const prepLabel = item.prepTimeMinutes ? `${item.prepTimeMinutes} min prep` : "Prepared fresh";

  return (
    <div className="page detail-page">
      <section className="detail-shell">
        <article className="panel detail-media-panel">
          <div className="detail-media-frame">
            <img
              className="detail-main-image"
              src={item.imageUrl || "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200"}
              alt={item.title}
            />
            <span className="menu-card-category">{categoryName}</span>
            <span className={`inventory-pill detail-stock-pill ${!inStock ? "is-out" : lowStock ? "is-low" : ""}`}>
              {!inStock ? "Out of stock" : lowStock ? `Only ${item.stockQty} left` : "Available now"}
            </span>
          </div>

          <div className="detail-media-footer">
            <div className="detail-note-card">
              <span className="section-kicker">Chef note</span>
              <strong>Built for a faster menu decision</strong>
              <p className="muted">
                Clear pricing, cleaner photography, and simpler actions keep the next step obvious.
              </p>
            </div>
            <div className="detail-note-card">
              <span className="section-kicker">Service</span>
              <strong>{prepLabel}</strong>
              <p className="muted">Live kitchen updates and easier checkout continue after you add this dish.</p>
            </div>
          </div>
        </article>

        <article className="panel detail-summary-panel">
          <Link className="btn-ghost detail-back-link" to="/menu">
            <i className="fa-solid fa-arrow-left" />
            Back to menu
          </Link>

          <div className="detail-heading">
            <p className="section-kicker">Dish detail</p>
            <h1 className="page-title">{item.title}</h1>
            <p className="muted detail-description">
              {item.description || "Prepared for guests who want a restaurant-first ordering experience without clutter."}
            </p>
          </div>

          <div className="detail-price-row">
            <div>
              <span className="detail-price-label">Current price</span>
              <strong className="detail-price">${Number(item.price || 0).toFixed(2)}</strong>
            </div>
            <div className="detail-status">
              <span className="status-dot" />
              <span>{inStock ? "Ready to order" : "Temporarily unavailable"}</span>
            </div>
          </div>

          <div className="detail-meta-grid">
            <div className="detail-meta-card">
              <span className="detail-meta-label">Category</span>
              <strong>{categoryName}</strong>
            </div>
            <div className="detail-meta-card">
              <span className="detail-meta-label">Preparation</span>
              <strong>{prepLabel}</strong>
            </div>
            <div className="detail-meta-card">
              <span className="detail-meta-label">Availability</span>
              <strong>{!inStock ? "Unavailable" : lowStock ? "Low stock" : "In stock"}</strong>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="detail-tag-row">
              {tags.map((tag) => (
                <span key={tag} className="menu-card-tags-chip">{tag}</span>
              ))}
            </div>
          )}

          <div className="detail-purchase-row">
            <div className="qty-stepper" aria-label="Quantity">
              <button type="button" onClick={() => setQty((current) => Math.max(1, current - 1))}>-</button>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
              <button type="button" onClick={() => setQty((current) => current + 1)}>+</button>
            </div>

            <button
              type="button"
              disabled={!inStock}
              onClick={() => addToCart(item, qty)}
            >
              <i className="fa-solid fa-bag-shopping" />
              {inStock ? "Add to cart" : "Unavailable"}
            </button>
          </div>

          <div className="detail-support-grid">
            <div className="detail-support-card">
              <i className="fa-solid fa-truck-fast" />
              <div>
                <strong>Fast delivery rhythm</strong>
                <span>Average handoff stays around 30 minutes across the public flow.</span>
              </div>
            </div>
            <div className="detail-support-card">
              <i className="fa-solid fa-shield-heart" />
              <div>
                <strong>Checkout clarity</strong>
                <span>Order summary, payment proof, and status updates stay visible after checkout.</span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default ProductDetailPage;

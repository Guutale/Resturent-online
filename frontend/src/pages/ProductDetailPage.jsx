import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useCart } from "../context/CartContext";

const ProductDetailPage = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    apiRequest(`/products/${id}`)
      .then((d) => setItem(d.item))
      .catch(() => setItem(null));
  }, [id]);

  if (!item) return <div className="page"><div className="panel muted">Loading item...</div></div>;
  const inStock = item.isAvailable && !(typeof item.stockQty === "number" && item.stockQty === 0);

  return (
    <div className="page two-col">
      <div className="panel">
        <img
          style={{ width: "100%", borderRadius: "12px" }}
          src={item.imageUrl || "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200"}
          alt={item.title}
        />
      </div>

      <div className="panel">
        <Link className="btn-ghost" to="/menu" style={{ marginBottom: "0.6rem" }}>Back to Menu</Link>
        <h2 className="page-title" style={{ marginBottom: "0.35rem" }}><i className="fa-solid fa-bowl-food" /> {item.title}</h2>
        <p className="muted">{item.description}</p>
        <h3 style={{ margin: "0.4rem 0 0.7rem" }}>${item.price}</h3>
        <p>
          <span className="status-dot" />
          {inStock ? "Available now" : "Out of stock"}
          {typeof item.stockQty === "number" && (
            <span className="muted" style={{ marginLeft: 10 }}>
              Stock: {item.stockQty}
            </span>
          )}
        </p>
        <div className="row">
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
            style={{ maxWidth: "110px" }}
          />
          <button disabled={!inStock} onClick={() => addToCart(item, qty)}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

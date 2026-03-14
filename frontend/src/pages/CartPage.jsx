import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const deliveryFee = 1;

const CartPage = () => {
  const { items, changeQty, removeItem, subtotal } = useCart();
  const { user } = useAuth();
  const total = subtotal + deliveryFee;
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  if (items.length === 0) {
    return (
      <div className="page cart-page">
        <section className="panel empty-state">
          <span className="empty-state-icon">
            <i className="fa-solid fa-bag-shopping" />
          </span>
          <p className="section-kicker">Cart</p>
          <h1 className="page-title">Your cart is still empty.</h1>
          <p className="muted">
            Start with the menu, compare dishes quickly, and build the order before moving into checkout.
          </p>
          <div className="empty-state-actions">
            <Link className="btn" to="/menu">Browse menu</Link>
            <Link className="btn-outline" to="/">Back home</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page cart-page">
      <section className="cart-shell">
        <article className="panel cart-items-panel">
          <div className="section-head">
            <div>
              <p className="section-kicker">Cart review</p>
              <h1 className="page-title">Everything lined up before checkout.</h1>
              <p className="muted">
                {totalItems} item{totalItems === 1 ? "" : "s"} ready for the next step.
              </p>
            </div>

            <Link className="btn-ghost" to="/menu">
              <i className="fa-solid fa-arrow-left" />
              Add more dishes
            </Link>
          </div>

          <div className="cart-line-list">
            {items.map((item) => {
              const lineTotal = Number(item.price || 0) * item.qty;

              return (
                <article key={item.productId} className="cart-item-card">
                  <div className="cart-item-media">
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=1200"}
                      alt={item.title}
                    />
                  </div>

                  <div className="cart-item-main">
                    <div className="cart-item-copy">
                      <strong>{item.title}</strong>
                      <span className="muted">Freshly prepared and kept inside the same premium flow.</span>
                    </div>

                    <div className="cart-item-controls">
                      <div className="qty-stepper" aria-label={`Quantity for ${item.title}`}>
                        <button type="button" onClick={() => changeQty(item.productId, item.qty - 1)}>-</button>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => changeQty(item.productId, Number(e.target.value) || 1)}
                        />
                        <button type="button" onClick={() => changeQty(item.productId, item.qty + 1)}>+</button>
                      </div>

                      <button type="button" className="btn-ghost" onClick={() => removeItem(item.productId)}>
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-price">
                    <span>${Number(item.price || 0).toFixed(2)} each</span>
                    <strong>${lineTotal.toFixed(2)}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        </article>

        <aside className="panel cart-summary-panel">
          <div className="summary-card-head">
            <p className="section-kicker">Summary</p>
            <h2 className="page-title">Checkout snapshot</h2>
          </div>

          <div className="summary-line">
            <span>Subtotal</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
          <div className="summary-line">
            <span>Delivery</span>
            <strong>${deliveryFee.toFixed(2)}</strong>
          </div>
          <div className="summary-line summary-line-total">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </div>

          <div className="summary-note">
            <i className="fa-solid fa-clock" />
            <span>Average delivery stays around 30 minutes after payment confirmation.</span>
          </div>

          <Link
            className="btn summary-cta"
            to={user ? "/checkout" : "/login"}
            state={user ? undefined : { from: "/checkout" }}
          >
            <i className="fa-solid fa-credit-card" />
            Continue to checkout
          </Link>

          {!user && (
            <p className="muted summary-caption">
              You will sign in first, then return directly to checkout.
            </p>
          )}
        </aside>
      </section>
    </div>
  );
};

export default CartPage;

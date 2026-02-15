import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const deliveryFee = 1;

const CartPage = () => {
  const { items, changeQty, removeItem, subtotal } = useCart();
  const { user } = useAuth();
  const total = subtotal + deliveryFee;

  return (
    <div className="page two-col">
      <div className="panel">
        <h2 className="page-title"><i className="fa-solid fa-cart-shopping" /> Cart</h2>
        {items.length === 0 && (
          <p className="muted">
            Cart is empty. <Link to="/menu" className="auth-link">Browse menu</Link>
          </p>
        )}
        {items.map((item) => (
          <div key={item.productId} className="row-between cart-line">
            <div>
              <strong>{item.title}</strong>
              <div className="muted">${item.price}</div>
            </div>
            <div className="row">
              <button onClick={() => changeQty(item.productId, item.qty - 1)}>-</button>
              <span>{item.qty}</span>
              <button onClick={() => changeQty(item.productId, item.qty + 1)}>+</button>
              <button className="btn-danger" onClick={() => removeItem(item.productId)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3><i className="fa-solid fa-receipt" /> Summary</h3>
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>Delivery: ${deliveryFee.toFixed(2)}</p>
        <h3>Total: ${total.toFixed(2)}</h3>
        <Link
          className="btn"
          to={user ? "/checkout" : "/login"}
          state={user ? undefined : { from: "/checkout" }}
        >
          Checkout
        </Link>
      </div>
    </div>
  );
};

export default CartPage;

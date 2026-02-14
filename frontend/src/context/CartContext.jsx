import React, { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  });

  const persist = (next) => {
    setItems(next);
    localStorage.setItem("cart", JSON.stringify(next));
  };

  const addToCart = (product, qty = 1) => {
    const found = items.find((x) => x.productId === product._id);
    const next = found
      ? items.map((x) => (x.productId === product._id ? { ...x, qty: x.qty + qty } : x))
      : [...items, { productId: product._id, title: product.title, price: product.price, qty, imageUrl: product.imageUrl || "" }];
    persist(next);
  };

  const changeQty = (productId, qty) => persist(items.map((x) => (x.productId === productId ? { ...x, qty: Math.max(1, qty) } : x)));
  const removeItem = (productId) => persist(items.filter((x) => x.productId !== productId));
  const clearCart = () => persist([]);
  const subtotal = items.reduce((sum, x) => sum + x.price * x.qty, 0);

  const value = useMemo(() => ({ items, addToCart, changeQty, removeItem, clearCart, subtotal }), [items, subtotal]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
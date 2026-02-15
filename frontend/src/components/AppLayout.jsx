import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const count = items.reduce((s, x) => s + x.qty, 0);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <NavLink className="logo" to="/">
            <span className="logo-mark">FP</span>
            <span>Flavor <span className="logo-text-accent">Point</span></span>
          </NavLink>

          <nav className="row nav">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/menu">Menu</NavLink>
            <a href="/#contact">Contact</a>
            {user && <NavLink to="/orders">Orders</NavLink>}
            {user && <NavLink to="/notifications">Notifications</NavLink>}
            {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
            {user?.role === "hr" && <NavLink to="/hr">HR</NavLink>}
            {user?.role === "finance" && <NavLink to="/finance">Finance</NavLink>}
            {user?.role === "dispatcher" && <NavLink to="/dispatcher">Dispatcher</NavLink>}
            {user?.role === "chef" && <NavLink to="/chef">Chef</NavLink>}
            {user?.role === "delivery" && <NavLink to="/delivery">Delivery</NavLink>}
          </nav>

          <div className="row">
            <NavLink to="/cart" className="pill">Cart {count}</NavLink>
            {user ? (
              <>
                <NavLink to="/profile" className="btn-ghost">{user.name}</NavLink>
                <button onClick={logout}>Logout</button>
              </>
            ) : (
              <NavLink to="/login" className="btn btn-signin">Sign In</NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>

      <footer id="contact" className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3>Flavor<span>Point</span></h3>
              <p>Modern restaurant ordering experience with clean design and smooth flow.</p>
              <div className="footer-social">
                <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
                <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
                <a href="#" aria-label="X"><i className="fa-brands fa-x-twitter" /></a>
              </div>
            </div>

            <div className="footer-col">
              <h4>Explore</h4>
              <a href="/">Home</a>
              <a href="/menu">Menu</a>
              <a href="/cart">Cart</a>
            </div>

            <div className="footer-col">
              <h4>Info</h4>
              <a href="#">About Us</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms</a>
              <a href="#">Support</a>
            </div>

            <div className="footer-col">
              <h4>Contact</h4>
              <a href="tel:+252610000000">+252 61 000 000</a>
              <a href="mailto:hello@flavorpoint.com">hello@flavorpoint.com</a>
              <a href="#">Mogadishu, Somalia</a>
            </div>
          </div>
          <div className="footer-bottom">Copyright 2026 FlavorPoint. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;

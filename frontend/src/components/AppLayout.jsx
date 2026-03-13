import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const rolePortalMap = {
  admin: { to: "/admin", label: "Admin" },
  hr: { to: "/hr", label: "HR" },
  finance: { to: "/finance", label: "Finance" },
  dispatcher: { to: "/dispatcher", label: "Dispatcher" },
  chef: { to: "/chef", label: "Chef" },
  delivery: { to: "/delivery", label: "Delivery" },
};

const navLinkClassName = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const count = items.reduce((s, x) => s + x.qty, 0);
  const portal = user ? rolePortalMap[user.role] : null;
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "GU";
  const quickLinks = [
    { to: "/", label: "Home" },
    { to: "/menu", label: "Menu" },
    ...(user ? [{ to: "/orders", label: "Orders" }] : []),
  ];

  return (
    <div className="app-shell">
      <div className="site-glow site-glow-left" />
      <div className="site-glow site-glow-right" />

      <header className="topbar">
        <div className="announcement-bar">
          <div className="container announcement-inner">
            <span>Open daily 8:00 AM - 11:00 PM</span>
            <div className="announcement-meta">
              <span><i className="fa-solid fa-bolt" /> Average delivery in 30 minutes</span>
              <span><i className="fa-solid fa-shield-heart" /> Smooth checkout and live order tracking</span>
            </div>
          </div>
        </div>

        <div className="container topbar-shell">
          <div className="topbar-inner">
            <NavLink className="logo" to="/">
              <span className="logo-mark">FP</span>
              <span className="logo-copy">
                <span className="logo-name">Flavor Point</span>
                <span className="logo-kicker">Curated kitchen delivery</span>
              </span>
            </NavLink>

            <nav className="nav" aria-label="Primary">
              <NavLink className={navLinkClassName} to="/">Home</NavLink>
              <NavLink className={navLinkClassName} to="/menu">Menu</NavLink>
              {user && <NavLink className={navLinkClassName} to="/orders">Orders</NavLink>}
              {user && <NavLink className={navLinkClassName} to="/notifications">Notifications</NavLink>}
              <a className="nav-link" href="#contact">Contact</a>
            </nav>

            <div className="header-actions">
              {portal && (
                <NavLink className="utility-chip" to={portal.to}>
                  <i className="fa-solid fa-briefcase" />
                  {portal.label}
                </NavLink>
              )}

              <NavLink className="cart-pill" to="/cart">
                <span className="cart-pill-icon">
                  <i className="fa-solid fa-bag-shopping" />
                </span>
                <span>Cart</span>
                <span className="cart-pill-count">{count}</span>
              </NavLink>

              {user ? (
                <>
                  <NavLink className="user-chip" to="/profile">
                    <span className="user-chip-avatar">{userInitials}</span>
                    <span className="user-chip-copy">
                      <strong>{user.name}</strong>
                      <span>{user.role === "user" ? "Customer account" : `${user.role} portal access`}</span>
                    </span>
                  </NavLink>
                  <button className="logout-button" onClick={logout}>Logout</button>
                </>
              ) : (
                <>
                  <NavLink className="btn-outline compact-btn" to="/register">Create account</NavLink>
                  <NavLink to="/login" className="btn compact-btn">Sign in</NavLink>
                </>
              )}
            </div>
          </div>

          <nav className="mobile-shortcuts" aria-label="Quick links">
            {quickLinks.map((link) => (
              <NavLink key={link.to} className={navLinkClassName} to={link.to}>
                {link.label}
              </NavLink>
            ))}
            {user && <NavLink className={navLinkClassName} to="/notifications">Notifications</NavLink>}
            <a className="nav-link" href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      <main className="container site-main">
        <Outlet />
      </main>

      <footer id="contact" className="site-footer">
        <div className="container">
          <section className="footer-cta">
            <div>
              <p className="section-kicker">Plan tonight's meal with less friction</p>
              <h2>Browse fast, order clearly, and keep the whole experience feeling premium.</h2>
            </div>
            <div className="footer-cta-actions">
              <NavLink className="btn" to="/menu">Browse menu</NavLink>
              {!user && <NavLink className="btn-outline" to="/register">Create account</NavLink>}
            </div>
          </section>

          <div className="footer-grid">
            <div className="footer-brand">
              <h3>Flavor<span>Point</span></h3>
              <p>Modern restaurant ordering with stronger hierarchy, cleaner presentation, and a smoother path from menu to checkout.</p>
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
          <div className="footer-bottom">
            <span>Copyright 2026 FlavorPoint. All rights reserved.</span>
            <div className="footer-bottom-links">
              <a href="/">Home</a>
              <a href="/menu">Menu</a>
              <a href="mailto:hello@flavorpoint.com">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;

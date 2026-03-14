import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
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

const siteLinks = [
  { label: "Home", type: "route", to: "/" },
  { label: "Menu", type: "route", to: "/menu" },
  { label: "Offers", type: "hash", to: "/#offers", hash: "#offers" },
  { label: "About", type: "hash", to: "/#about", hash: "#about" },
  { label: "Contact", type: "hash", to: "/#contact", hash: "#contact" },
];

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const portal = user ? rolePortalMap[user.role] : null;
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "GU";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!location.hash) return;

    const target = document.querySelector(location.hash);
    if (!target) return;

    window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, [location.hash, location.pathname]);

  const mobileLinks = useMemo(() => siteLinks, []);

  return (
    <div className="app-shell">
      <div className="site-glow site-glow-left" />
      <div className="site-glow site-glow-right" />

      <header className="topbar hero-topbar">
        <div className="container topbar-shell">
          <div className="topbar-inner hero-nav-shell">
            <Link className="logo" to="/">
              <span className="logo-mark">FP</span>
              <span className="logo-copy">
                <span className="logo-name">Flavor Point</span>
                <span className="logo-kicker">Cinematic meal promotions</span>
              </span>
            </Link>

            <nav className="nav hero-nav" aria-label="Primary">
              {siteLinks.map((link) => (
                link.type === "route" ? (
                  <NavLink key={link.label} className={navLinkClassName} to={link.to} end={link.to === "/"}>
                    {link.label}
                  </NavLink>
                ) : (
                  <Link
                    key={link.label}
                    className={`nav-link ${location.pathname === "/" && location.hash === link.hash ? "active" : ""}`}
                    to={link.to}
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </nav>

            <div className="header-actions hero-header-actions">
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
                <NavLink to="/login" className="btn hero-login-btn">
                  <i className="fa-solid fa-user" />
                  Login
                </NavLink>
              )}

              <button
                type="button"
                className={`menu-toggle ${mobileOpen ? "is-open" : ""}`}
                onClick={() => setMobileOpen((current) => !current)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>

          <div className={`mobile-drawer ${mobileOpen ? "is-open" : ""}`}>
            <nav className="mobile-drawer-nav" aria-label="Mobile navigation">
              {mobileLinks.map((link) => (
                link.type === "route" ? (
                  <NavLink
                    key={link.label}
                    className={navLinkClassName}
                    to={link.to}
                    end={link.to === "/"}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ) : (
                  <Link
                    key={link.label}
                    className="nav-link"
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </nav>

            <div className="mobile-drawer-actions">
              {!user && (
                <Link className="btn" to="/register" onClick={() => setMobileOpen(false)}>
                  Create account
                </Link>
              )}
              {user && (
                <Link className="btn-outline" to="/notifications" onClick={() => setMobileOpen(false)}>
                  Notifications
                </Link>
              )}
              <Link className="btn-outline" to="/menu" onClick={() => setMobileOpen(false)}>
                Browse menu
              </Link>
            </div>
          </div>
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
              <h2>Promote the right discount, guide the next click, and keep the full journey premium.</h2>
            </div>
            <div className="footer-cta-actions">
              <NavLink className="btn" to="/menu">Browse menu</NavLink>
              {!user && <NavLink className="btn-outline" to="/register">Create account</NavLink>}
            </div>
          </section>

          <div className="footer-grid">
            <div className="footer-brand">
              <h3>Flavor<span>Point</span></h3>
              <p>Dark cinematic promotions, admin-controlled banner deals, and a cleaner restaurant funnel from hero to checkout.</p>
              <div className="footer-social">
                <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
                <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
                <a href="#" aria-label="X"><i className="fa-brands fa-x-twitter" /></a>
              </div>
            </div>

            <div className="footer-col">
              <h4>Explore</h4>
              <Link to="/">Home</Link>
              <Link to="/menu">Menu</Link>
              <Link to="/#offers">Offers</Link>
            </div>

            <div className="footer-col">
              <h4>Info</h4>
              <Link to="/#about">About</Link>
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
              <Link to="/">Home</Link>
              <Link to="/menu">Menu</Link>
              <a href="mailto:hello@flavorpoint.com">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;

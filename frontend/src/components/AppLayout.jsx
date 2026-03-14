import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { apiRequest } from "../lib/api";
import { normalizeHomepageContent } from "../lib/homepageContent";

const rolePortalMap = {
  admin: { to: "/admin", label: "Admin" },
  hr: { to: "/hr", label: "HR" },
  finance: { to: "/finance", label: "Finance" },
  dispatcher: { to: "/dispatcher", label: "Dispatcher" },
  chef: { to: "/chef", label: "Chef" },
  delivery: { to: "/delivery", label: "Delivery" },
};

const siteLinks = [
  { label: "Home", type: "route", to: "/" },
  { label: "Menu", type: "route", to: "/menu" },
  { label: "Offers", type: "hash", to: "/#offers", hash: "#offers" },
  { label: "About", type: "hash", to: "/#about", hash: "#about" },
  { label: "Contact", type: "hash", to: "/#contact", hash: "#contact" },
];

const isExternalLink = (value) => /^(https?:\/\/|mailto:|tel:)/i.test(String(value || "").trim());

const FooterActionLink = ({ className, to, children }) => {
  if (!to) return null;

  if (isExternalLink(to)) {
    return (
      <a className={className} href={to} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link className={className} to={to}>
      {children}
    </Link>
  );
};

const navLinkClassName = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [homepageContent, setHomepageContent] = useState({ sections: [], sectionsByKey: {} });
  const [homepageLoading, setHomepageLoading] = useState(true);
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

  const loadHomepageContent = async () => {
    setHomepageLoading(true);
    try {
      const data = await apiRequest("/homepage-content");
      setHomepageContent(normalizeHomepageContent(data));
    } catch {
      setHomepageContent({ sections: [], sectionsByKey: {} });
    } finally {
      setHomepageLoading(false);
    }
  };

  useEffect(() => {
    loadHomepageContent();
  }, []);

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
  const footerSection = homepageContent.sectionsByKey.footer;
  const footerSettings = footerSection?.settings || {};
  const footerLinks = footerSettings.footerLinks || [];
  const socialLinks = [
    { label: "Facebook", href: footerSettings.facebookUrl, icon: "fa-brands fa-facebook-f" },
    { label: "Instagram", href: footerSettings.instagramUrl, icon: "fa-brands fa-instagram" },
    { label: "TikTok", href: footerSettings.tiktokUrl, icon: "fa-brands fa-tiktok" },
  ].filter((entry) => entry.href);

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
                <span className="logo-name">{footerSettings.restaurantName || "Flavor Point"}</span>
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
        <Outlet context={{ homepageContent, homepageLoading, reloadHomepageContent: loadHomepageContent }} />
      </main>

      {!homepageLoading && footerSection?.isVisible !== false && (
        <footer className="site-footer">
          <div className="container">
            <section className="footer-cta">
              <div>
                <p className="section-kicker">{footerSection.title || "Plan tonight's meal with less friction"}</p>
                <h2>{footerSection.subtitle || "Promote the right discount, guide the next click, and keep the full journey premium."}</h2>
              </div>
              <div className="footer-cta-actions">
                <NavLink className="btn" to="/menu">Browse menu</NavLink>
                {!user && <NavLink className="btn-outline" to="/register">Create account</NavLink>}
              </div>
            </section>

            <div className="footer-grid">
              <div className="footer-brand">
                <h3>{footerSettings.restaurantName || "Flavor Point"}</h3>
                <p>{footerSettings.openingHours || "Open daily for premium promotions, fast ordering, and a cleaner restaurant funnel from hero to checkout."}</p>
                <div className="footer-social">
                  {socialLinks.map((entry) => (
                    <a key={entry.label} href={entry.href} aria-label={entry.label} target="_blank" rel="noreferrer">
                      <i className={entry.icon} />
                    </a>
                  ))}
                </div>
              </div>

              <div className="footer-col">
                <h4>Explore</h4>
                {footerLinks.map((entry) => (
                  <FooterActionLink key={`${entry.label}-${entry.href}`} to={entry.href}>
                    {entry.label}
                  </FooterActionLink>
                ))}
              </div>

              <div className="footer-col">
                <h4>Contact</h4>
                {footerSettings.phone && <a href={`tel:${footerSettings.phone}`}>{footerSettings.phone}</a>}
                {footerSettings.email && <a href={`mailto:${footerSettings.email}`}>{footerSettings.email}</a>}
                {footerSettings.address && <span>{footerSettings.address}</span>}
              </div>

              <div className="footer-col">
                <h4>Hours</h4>
                <span>{footerSettings.openingHours}</span>
              </div>
            </div>

            <div className="footer-bottom">
              <span>Copyright 2026 {footerSettings.restaurantName || "Flavor Point"}. All rights reserved.</span>
              <div className="footer-bottom-links">
                {footerLinks.slice(0, 3).map((entry) => (
                  <FooterActionLink key={`bottom-${entry.label}-${entry.href}`} to={entry.href}>
                    {entry.label}
                  </FooterActionLink>
                ))}
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default AppLayout;

import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const onLogout = () => {
    logout();
    nav("/", { replace: true });
  };

  const navClass = ({ isActive }) => `admin-nav-item${isActive ? " active" : ""}`;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span className="admin-logo-dot" />
          <span>
            FlavorPoint <span className="admin-logo-accent">Admin</span>
          </span>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin" end className={navClass}>
            <i className="fa-solid fa-chart-line" />
            Dashboard
          </NavLink>
          <NavLink to="/admin/homepage" className={navClass}>
            <i className="fa-solid fa-house" />
            Homepage
          </NavLink>
          <NavLink to="/admin/hero-slides" className={navClass}>
            <i className="fa-solid fa-images" />
            Hero Banners
          </NavLink>
          <NavLink to="/admin/categories" className={navClass}>
            <i className="fa-solid fa-layer-group" />
            Categories
          </NavLink>
          <NavLink to="/admin/products" className={navClass}>
            <i className="fa-solid fa-burger" />
            Products
          </NavLink>
          <NavLink to="/admin/orders" className={navClass}>
            <i className="fa-solid fa-box" />
            Orders
          </NavLink>
          <NavLink to="/admin/users" className={navClass}>
            <i className="fa-solid fa-users" />
            Users
          </NavLink>
          <NavLink to="/admin/staff" className={navClass}>
            <i className="fa-solid fa-user-gear" />
            Staff
          </NavLink>
          <NavLink to="/admin/payroll" className={navClass}>
            <i className="fa-solid fa-money-check-dollar" />
            Payroll
          </NavLink>
          <NavLink to="/admin/payments" className={navClass}>
            <i className="fa-solid fa-credit-card" />
            Payments
          </NavLink>
          <NavLink to="/admin/notifications" className={navClass}>
            <i className="fa-regular fa-bell" />
            Notifications
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar" aria-hidden="true">
              {(user?.name || "A").slice(0, 1).toUpperCase()}
            </div>
            <div className="admin-user-meta">
              <div className="admin-user-name">{user?.name || "Admin"}</div>
              <div className="admin-user-role">Administrator</div>
            </div>
          </div>
          <button type="button" className="admin-logout" onClick={onLogout}>
            <i className="fa-solid fa-right-from-bracket" />
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

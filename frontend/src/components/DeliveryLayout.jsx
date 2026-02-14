import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DeliveryLayout = () => {
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
            FlavorPoint <span className="admin-logo-accent">Delivery</span>
          </span>
        </div>

        <nav className="admin-nav">
          <NavLink to="/delivery" end className={navClass}>
            <i className="fa-solid fa-truck-fast" />
            Assigned Orders
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar" aria-hidden="true">
              {(user?.name || "D").slice(0, 1).toUpperCase()}
            </div>
            <div className="admin-user-meta">
              <div className="admin-user-name">{user?.name || "Delivery"}</div>
              <div className="admin-user-role">Delivery</div>
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

export default DeliveryLayout;


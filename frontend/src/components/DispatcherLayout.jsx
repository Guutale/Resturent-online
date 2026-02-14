import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DispatcherLayout = () => {
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
            FlavorPoint <span className="admin-logo-accent">Dispatcher</span>
          </span>
        </div>

        <nav className="admin-nav">
          <NavLink to="/dispatcher" end className={navClass}>
            <i className="fa-solid fa-route" />
            Delivery Orders
          </NavLink>
          <NavLink to="/dispatcher/delivery-staff" className={navClass}>
            <i className="fa-solid fa-truck-fast" />
            Delivery Staff
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar" aria-hidden="true">
              {(user?.name || "D").slice(0, 1).toUpperCase()}
            </div>
            <div className="admin-user-meta">
              <div className="admin-user-name">{user?.name || "Dispatcher"}</div>
              <div className="admin-user-role">Dispatcher</div>
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

export default DispatcherLayout;


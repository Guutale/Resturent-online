import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FinanceLayout = () => {
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
            FlavorPoint <span className="admin-logo-accent">Finance</span>
          </span>
        </div>

        <nav className="admin-nav">
          <NavLink to="/finance" end className={navClass}>
            <i className="fa-solid fa-chart-pie" />
            Dashboard
          </NavLink>
          <NavLink to="/finance/payroll" className={navClass}>
            <i className="fa-solid fa-money-check-dollar" />
            Payroll
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar" aria-hidden="true">
              {(user?.name || "F").slice(0, 1).toUpperCase()}
            </div>
            <div className="admin-user-meta">
              <div className="admin-user-name">{user?.name || "Finance"}</div>
              <div className="admin-user-role">Finance</div>
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

export default FinanceLayout;


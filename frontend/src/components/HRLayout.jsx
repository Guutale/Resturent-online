import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HRLayout = () => {
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
            FlavorPoint <span className="admin-logo-accent">HR</span>
          </span>
        </div>

        <nav className="admin-nav">
          <NavLink to="/hr" end className={navClass}>
            <i className="fa-solid fa-people-group" />
            Dashboard
          </NavLink>
          <NavLink to="/hr/hero-slides" className={navClass}>
            <i className="fa-solid fa-images" />
            Hero Banners
          </NavLink>
          <NavLink to="/hr/staff" className={navClass}>
            <i className="fa-solid fa-user-gear" />
            Staff
          </NavLink>
          <NavLink to="/hr/attendance" className={navClass}>
            <i className="fa-solid fa-calendar-check" />
            Attendance
          </NavLink>
          <NavLink to="/hr/salary-structures" className={navClass}>
            <i className="fa-solid fa-scale-balanced" />
            Salary Structure
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar" aria-hidden="true">
              {(user?.name || "H").slice(0, 1).toUpperCase()}
            </div>
            <div className="admin-user-meta">
              <div className="admin-user-name">{user?.name || "HR"}</div>
              <div className="admin-user-role">HR</div>
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

export default HRLayout;

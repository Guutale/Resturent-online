import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardRoleLabel, getDashboardRoleMeta } from "../lib/dashboardRoles";

const DashboardLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const meta = useMemo(() => getDashboardRoleMeta(role || user?.role), [role, user?.role]);

  const pageLabel = useMemo(() => {
    if (!meta) return "Dashboard";
    const item = meta.navItems.find((entry) => {
      const basePath = entry.to.split("?")[0];
      return location.pathname === basePath || location.pathname.startsWith(`${basePath}/`);
    });
    return item?.label || meta.label;
  }, [location.pathname, meta]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const navClass = ({ isActive }) => `admin-nav-item${isActive ? " active" : ""}`;

  if (!meta) return null;

  return (
    <div className="admin-shell dashboard-shell">
      <div
        className={`dashboard-backdrop${sidebarOpen ? " open" : ""}`}
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`admin-sidebar dashboard-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="admin-logo">
          <span className="admin-logo-dot" />
          <span>
            FlavorPoint <span className="admin-logo-accent">{meta.shortLabel}</span>
          </span>
        </div>

        <nav className="admin-nav">
          {meta.navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split("?")[0] === meta.home}
              className={navClass}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`fa-solid ${item.icon}`} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar" aria-hidden="true">
              {(user?.name || meta.label).slice(0, 1).toUpperCase()}
            </div>
            <div className="admin-user-meta">
              <div className="admin-user-name">{user?.name || meta.label}</div>
              <div className="admin-user-role">{getDashboardRoleLabel(user?.role)}</div>
            </div>
          </div>
          <button type="button" className="admin-logout" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket" />
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main dashboard-main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-menu-btn"
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label="Toggle menu"
          >
            <i className="fa-solid fa-bars" />
          </button>

          <div className="dashboard-topbar-copy">
            <p className="dashboard-topbar-kicker">{meta.themeTitle}</p>
            <h1 className="dashboard-topbar-title">{pageLabel}</h1>
          </div>

          <div className="dashboard-topbar-actions">
            <NavLink className="dashboard-chip" to={meta.settingsPath}>
              <i className="fa-solid fa-user-gear" />
              {getDashboardRoleLabel(user?.role)}
            </NavLink>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;

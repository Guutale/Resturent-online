import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardHome, getDashboardRoleLabel } from "../lib/dashboardRoles";

const UnauthorizedPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const nextPath = getDashboardHome(user?.role);

  return (
    <div className="page auth-page">
      <section className="auth-layout">
        <article className="panel auth-showcase">
          <p className="section-kicker">Access denied</p>
          <h1 className="page-title">This page does not belong to your role.</h1>
          <p className="muted">
            {user ? `${getDashboardRoleLabel(user.role)} accounts can only access their assigned dashboard tools.` : "You need to sign in first."}
          </p>
        </article>

        <div className="panel auth-form-card">
          <span className="auth-icon-top"><i className="fa-solid fa-lock" /></span>
          <h2 className="page-title">Unauthorized</h2>
          <p className="muted auth-caption">Requested path: {location.state?.from || location.pathname}</p>
          <div className="admin-modal-actions" style={{ justifyContent: "center" }}>
            <Link className="auth-submit" to={user ? nextPath : "/login"}>
              <i className="fa-solid fa-arrow-right" />
              {user ? "Go to my dashboard" : "Sign in"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UnauthorizedPage;

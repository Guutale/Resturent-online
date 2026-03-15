import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStoredAuthToken } from "../lib/authStorage";
import { getDashboardLoginPath, isAllowedDashboardRole } from "../lib/dashboardRoles";

const RoleRoute = ({ children, allowedRoles = [], loginPath }) => {
  const location = useLocation();
  const { user } = useAuth();
  const token = getStoredAuthToken();

  if (!user || !token) {
    return (
      <Navigate
        to={loginPath || getDashboardLoginPath(allowedRoles)}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (!isAllowedDashboardRole(user.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return children;
};

export default RoleRoute;

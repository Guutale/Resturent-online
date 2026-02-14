import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  if (!user || !token) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  return user.role === "admin" ? children : <Navigate to="/" replace />;
};

export default AdminRoute;

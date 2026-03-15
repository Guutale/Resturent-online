import React from "react";
import RoleRoute from "./RoleRoute";

const AdminRoute = ({ children }) => <RoleRoute allowedRoles={["admin"]} loginPath="/admin/login">{children}</RoleRoute>;

export default AdminRoute;

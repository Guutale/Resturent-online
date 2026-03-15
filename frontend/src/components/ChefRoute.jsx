import React from "react";
import RoleRoute from "./RoleRoute";

const ChefRoute = ({ children }) => <RoleRoute allowedRoles={["chef"]}>{children}</RoleRoute>;

export default ChefRoute;

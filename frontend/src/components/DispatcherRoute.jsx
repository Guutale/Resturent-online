import React from "react";
import RoleRoute from "./RoleRoute";

const DispatcherRoute = ({ children }) => <RoleRoute allowedRoles={["dispatcher"]}>{children}</RoleRoute>;

export default DispatcherRoute;

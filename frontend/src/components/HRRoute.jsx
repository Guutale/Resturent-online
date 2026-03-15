import React from "react";
import RoleRoute from "./RoleRoute";

const HRRoute = ({ children }) => <RoleRoute allowedRoles={["hr"]}>{children}</RoleRoute>;

export default HRRoute;

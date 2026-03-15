import React from "react";
import RoleRoute from "./RoleRoute";

const FinanceRoute = ({ children }) => <RoleRoute allowedRoles={["finance"]}>{children}</RoleRoute>;

export default FinanceRoute;

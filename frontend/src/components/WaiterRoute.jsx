import React from "react";
import RoleRoute from "./RoleRoute";

const WaiterRoute = ({ children }) => <RoleRoute allowedRoles={["waiter"]}>{children}</RoleRoute>;

export default WaiterRoute;

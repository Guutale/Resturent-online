import React from "react";
import RoleRoute from "./RoleRoute";

const DeliveryRoute = ({ children }) => <RoleRoute allowedRoles={["delivery"]}>{children}</RoleRoute>;

export default DeliveryRoute;

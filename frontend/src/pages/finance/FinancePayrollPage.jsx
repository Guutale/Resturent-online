import React from "react";
import AdminPayrollPage from "../admin/AdminPayrollPage";

// Reuse the same payroll UI; backend RBAC now allows finance to access /api/payroll/* endpoints.
const FinancePayrollPage = () => <AdminPayrollPage />;

export default FinancePayrollPage;


import { Router } from "express";
import {
  adminCreateSalaryPayment,
  adminGetSalaryPayment,
  adminListSalaryPayments,
  adminPayrollReport,
  adminStaffSalaryPayments,
  adminUpdateSalaryPayment,
} from "../controllers/payroll.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.get("/payments", authMiddleware, allowRoles(["admin", "finance"]), adminListSalaryPayments);
router.post("/payments", authMiddleware, allowRoles(["admin", "finance"]), adminCreateSalaryPayment);
router.get("/payments/:id", authMiddleware, allowRoles(["admin", "finance"]), adminGetSalaryPayment);
router.patch("/payments/:id", authMiddleware, allowRoles(["admin", "finance"]), adminUpdateSalaryPayment);

router.get("/staff/:staffId/payments", authMiddleware, allowRoles(["admin", "finance", "hr"]), adminStaffSalaryPayments);
router.get("/report", authMiddleware, allowRoles(["admin", "finance"]), adminPayrollReport);

export default router;

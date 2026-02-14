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
import { adminMiddleware } from "../middleware/admin.js";

const router = Router();

router.get("/payments", authMiddleware, adminMiddleware, adminListSalaryPayments);
router.post("/payments", authMiddleware, adminMiddleware, adminCreateSalaryPayment);
router.get("/payments/:id", authMiddleware, adminMiddleware, adminGetSalaryPayment);
router.patch("/payments/:id", authMiddleware, adminMiddleware, adminUpdateSalaryPayment);

router.get("/staff/:staffId/payments", authMiddleware, adminMiddleware, adminStaffSalaryPayments);
router.get("/report", authMiddleware, adminMiddleware, adminPayrollReport);

export default router;


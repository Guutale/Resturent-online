import { Router } from "express";
import { adminGetPayment, adminListPayments, adminUpdatePayment } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.get("/", authMiddleware, allowRoles(["admin", "finance"]), adminListPayments);
router.get("/:id", authMiddleware, allowRoles(["admin", "finance"]), adminGetPayment);
router.patch("/:id", authMiddleware, allowRoles(["admin", "finance"]), adminUpdatePayment);

export default router;

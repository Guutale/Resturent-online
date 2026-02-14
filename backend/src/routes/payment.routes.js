import { Router } from "express";
import { adminGetPayment, adminListPayments, adminUpdatePayment } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

const router = Router();

router.get("/", authMiddleware, adminMiddleware, adminListPayments);
router.get("/:id", authMiddleware, adminMiddleware, adminGetPayment);
router.patch("/:id", authMiddleware, adminMiddleware, adminUpdatePayment);

export default router;


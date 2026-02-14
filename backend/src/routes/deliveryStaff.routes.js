import { Router } from "express";
import {
  createDeliveryStaff,
  deliveryStaffPerformance,
  listDeliveryStaff,
  updateDeliveryStaff,
} from "../controllers/deliveryStaff.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.get("/", authMiddleware, allowRoles(["admin", "dispatcher", "chef"]), listDeliveryStaff);
router.post("/", authMiddleware, allowRoles(["admin", "dispatcher"]), createDeliveryStaff);
router.get("/:id/performance", authMiddleware, allowRoles(["admin", "dispatcher"]), deliveryStaffPerformance);
router.patch("/:id", authMiddleware, allowRoles(["admin", "dispatcher"]), updateDeliveryStaff);

export default router;


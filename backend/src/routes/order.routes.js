import { Router } from "express";
import {
  adminAssignDelivery,
  adminListOrders,
  adminUpdateOrderStatus,
  cancelMyOrder,
  createOrder,
  deliveryAssignedOrders,
  deliveryUpdateOrderStatus,
  getOrderById,
  getOrderInvoice,
  kitchenOrders,
  myOrders,
  updateKitchenStatus,
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import { deliveryMiddleware } from "../middleware/delivery.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.post("/", authMiddleware, createOrder);
router.get("/my", authMiddleware, myOrders);
router.get("/assigned", authMiddleware, deliveryMiddleware, deliveryAssignedOrders);
router.get("/kitchen", authMiddleware, allowRoles(["chef", "admin"]), kitchenOrders);
router.get("/:id", authMiddleware, getOrderById);
router.get("/:id/invoice", authMiddleware, getOrderInvoice);
router.patch("/:id/cancel", authMiddleware, cancelMyOrder);
router.patch("/:id/kitchen-status", authMiddleware, allowRoles(["chef", "admin"]), updateKitchenStatus);
router.patch("/:id/delivery-status", authMiddleware, allowRoles(["delivery", "dispatcher"]), deliveryUpdateOrderStatus);

router.get("/", authMiddleware, allowRoles(["admin", "dispatcher"]), adminListOrders);
router.patch("/:id/status", authMiddleware, adminMiddleware, adminUpdateOrderStatus);
router.patch("/:id/assign-delivery", authMiddleware, allowRoles(["admin", "chef", "dispatcher"]), adminAssignDelivery);

export default router;

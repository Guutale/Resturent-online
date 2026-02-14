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
  myOrders,
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import { deliveryMiddleware } from "../middleware/delivery.js";

const router = Router();

router.post("/", authMiddleware, createOrder);
router.get("/my", authMiddleware, myOrders);
router.get("/assigned", authMiddleware, deliveryMiddleware, deliveryAssignedOrders);
router.get("/:id", authMiddleware, getOrderById);
router.get("/:id/invoice", authMiddleware, getOrderInvoice);
router.patch("/:id/cancel", authMiddleware, cancelMyOrder);
router.patch("/:id/delivery-status", authMiddleware, deliveryMiddleware, deliveryUpdateOrderStatus);

router.get("/", authMiddleware, adminMiddleware, adminListOrders);
router.patch("/:id/status", authMiddleware, adminMiddleware, adminUpdateOrderStatus);
router.patch("/:id/assign-delivery", authMiddleware, adminMiddleware, adminAssignDelivery);

export default router;

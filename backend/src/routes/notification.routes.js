import { Router } from "express";
import {
  adminNotifications,
  markAllAdminNotificationsRead,
  markAllMyNotificationsRead,
  markNotificationRead,
  myNotifications,
} from "../controllers/notification.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

const router = Router();

router.get("/my", authMiddleware, myNotifications);
router.patch("/my/read-all", authMiddleware, markAllMyNotificationsRead);

router.get("/admin", authMiddleware, adminMiddleware, adminNotifications);
router.patch("/admin/read-all", authMiddleware, adminMiddleware, markAllAdminNotificationsRead);

router.patch("/:id/read", authMiddleware, markNotificationRead);

export default router;


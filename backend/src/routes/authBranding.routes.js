import { Router } from "express";
import {
  adminListAuthBranding,
  listActiveAuthBranding,
  upsertAuthBranding,
} from "../controllers/authBranding.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

const router = Router();

router.get("/", listActiveAuthBranding);
router.get("/admin", authMiddleware, adminMiddleware, adminListAuthBranding);
router.patch("/:pageType", authMiddleware, adminMiddleware, upsertAuthBranding);

export default router;

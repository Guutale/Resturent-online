import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import { revenueSummary } from "../controllers/finance.controller.js";

const router = Router();

router.get("/revenue", authMiddleware, allowRoles(["admin", "finance"]), revenueSummary);

export default router;


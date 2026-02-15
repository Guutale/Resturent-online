import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import { listAttendance, upsertAttendance } from "../controllers/attendance.controller.js";

const router = Router();

router.get("/", authMiddleware, allowRoles(["admin", "hr"]), listAttendance);
router.post("/", authMiddleware, allowRoles(["admin", "hr"]), upsertAttendance);

export default router;


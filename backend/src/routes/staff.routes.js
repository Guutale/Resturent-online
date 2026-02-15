import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import { createStaff, deleteStaff, getStaffById, listStaff, updateStaff } from "../controllers/staff.controller.js";

const router = Router();

router.get("/", authMiddleware, allowRoles(["admin", "hr"]), listStaff);
router.post("/", authMiddleware, allowRoles(["admin", "hr"]), createStaff);
router.get("/:id", authMiddleware, allowRoles(["admin", "hr"]), getStaffById);
router.patch("/:id", authMiddleware, allowRoles(["admin", "hr"]), updateStaff);
router.delete("/:id", authMiddleware, allowRoles(["admin", "hr"]), deleteStaff);

export default router;


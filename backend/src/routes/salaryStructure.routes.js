import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import {
  createSalaryStructure,
  getCurrentSalaryStructure,
  listSalaryStructures,
  updateSalaryStructure,
} from "../controllers/salaryStructure.controller.js";

const router = Router();

router.get("/", authMiddleware, allowRoles(["admin", "hr"]), listSalaryStructures);
router.get("/current/:staffUserId", authMiddleware, allowRoles(["admin", "hr"]), getCurrentSalaryStructure);
router.post("/", authMiddleware, allowRoles(["admin", "hr"]), createSalaryStructure);
router.patch("/:id", authMiddleware, allowRoles(["admin", "hr"]), updateSalaryStructure);

export default router;


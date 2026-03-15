import { Router } from "express";
import { createTable, deleteTable, listTables, updateTable } from "../controllers/table.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.get("/", authMiddleware, allowRoles(["admin", "waiter"]), listTables);
router.post("/", authMiddleware, allowRoles(["admin"]), createTable);
router.patch("/:id", authMiddleware, allowRoles(["admin"]), updateTable);
router.delete("/:id", authMiddleware, allowRoles(["admin"]), deleteTable);

export default router;

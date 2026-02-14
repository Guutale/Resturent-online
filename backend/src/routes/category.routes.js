import { Router } from "express";
import {
  adminListCategories,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

const router = Router();

router.get("/admin", authMiddleware, adminMiddleware, adminListCategories);
router.get("/", listCategories);
router.post("/", authMiddleware, adminMiddleware, createCategory);
router.patch("/:id", authMiddleware, adminMiddleware, updateCategory);
router.delete("/:id", authMiddleware, adminMiddleware, deleteCategory);

export default router;

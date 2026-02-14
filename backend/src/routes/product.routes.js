import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  toggleAvailability,
  updateProduct,
} from "../controllers/product.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

const router = Router();

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", authMiddleware, adminMiddleware, createProduct);
router.patch("/:id", authMiddleware, adminMiddleware, updateProduct);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);
router.patch("/:id/availability", authMiddleware, adminMiddleware, toggleAvailability);

export default router;

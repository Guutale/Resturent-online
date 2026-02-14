import { Router } from "express";
import {
  addAddress,
  adminDeleteUser,
  adminGetUser,
  adminListUsers,
  adminUserOrders,
  adminUpdateUser,
  changeMyPassword,
  deleteAddress,
  updateAddress,
  updateMe,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

const router = Router();

router.patch("/me", authMiddleware, updateMe);
router.patch("/me/password", authMiddleware, changeMyPassword);
router.post("/me/addresses", authMiddleware, addAddress);
router.patch("/me/addresses/:id", authMiddleware, updateAddress);
router.delete("/me/addresses/:id", authMiddleware, deleteAddress);

router.get("/", authMiddleware, adminMiddleware, adminListUsers);
router.get("/:id/orders", authMiddleware, adminMiddleware, adminUserOrders);
router.get("/:id", authMiddleware, adminMiddleware, adminGetUser);
router.patch("/:id", authMiddleware, adminMiddleware, adminUpdateUser);
router.delete("/:id", authMiddleware, adminMiddleware, adminDeleteUser);

export default router;

import { Router } from "express";
import {
  adminListHomepageContent,
  createHomepageItem,
  deleteHomepageItem,
  listHomepageContent,
  reorderHomepageItems,
  reorderHomepageSections,
  updateHomepageItem,
  updateHomepageSection,
} from "../controllers/homepageContent.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();
const homepageManager = allowRoles(["admin", "hr"]);

router.get("/", listHomepageContent);
router.get("/admin", authMiddleware, homepageManager, adminListHomepageContent);
router.patch("/sections/reorder", authMiddleware, homepageManager, reorderHomepageSections);
router.patch("/sections/:sectionKey", authMiddleware, homepageManager, updateHomepageSection);
router.post("/sections/:sectionKey/items", authMiddleware, homepageManager, createHomepageItem);
router.patch("/sections/:sectionKey/items/reorder", authMiddleware, homepageManager, reorderHomepageItems);
router.patch("/items/:id", authMiddleware, homepageManager, updateHomepageItem);
router.delete("/items/:id", authMiddleware, homepageManager, deleteHomepageItem);

export default router;

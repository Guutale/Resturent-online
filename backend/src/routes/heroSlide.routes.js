import { Router } from "express";
import {
  adminListHeroSlides,
  createHeroSlide,
  deleteHeroSlide,
  listActiveHeroSlides,
  reorderHeroSlides,
  updateHeroSlide,
} from "../controllers/heroSlide.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();
const heroSlideManager = allowRoles(["admin", "hr"]);

router.get("/", listActiveHeroSlides);
router.get("/admin", authMiddleware, heroSlideManager, adminListHeroSlides);
router.post("/", authMiddleware, heroSlideManager, createHeroSlide);
router.patch("/reorder", authMiddleware, heroSlideManager, reorderHeroSlides);
router.patch("/:id", authMiddleware, heroSlideManager, updateHeroSlide);
router.delete("/:id", authMiddleware, heroSlideManager, deleteHeroSlide);

export default router;

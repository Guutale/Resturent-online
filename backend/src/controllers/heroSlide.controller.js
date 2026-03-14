import HeroSlide from "../models/HeroSlide.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../utils/audit.js";
import {
  HERO_AVAILABILITY_STATUSES,
  HERO_DISCOUNT_TYPES,
  calculateHeroFinalPrice,
  isHeroSlideWithinSchedule,
} from "../utils/heroSlidePricing.js";

const sanitizeString = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

const isValidActionLink = (value) => /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value);

const parseOptionalBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new Error("isActive must be boolean");
  return value;
};

const parseAutoplaySeconds = (value, fallback = 5) => {
  const numeric = value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0 || numeric > 20) {
    throw new Error("autoplaySeconds must be an integer between 1 and 20");
  }
  return numeric;
};

const parseDiscountType = (value, fallback = "none") => {
  const next = value === undefined || value === null || value === "" ? fallback : String(value).trim().toLowerCase();
  if (!HERO_DISCOUNT_TYPES.includes(next)) {
    throw new Error("discountType must be none, percentage, or fixed");
  }
  return next;
};

const parseAvailabilityStatus = (value, fallback = "available") => {
  const next = value === undefined || value === null || value === "" ? fallback : String(value).trim().toLowerCase();
  if (!HERO_AVAILABILITY_STATUSES.includes(next)) {
    throw new Error("availabilityStatus must be available, unavailable, or out_of_stock");
  }
  return next;
};

const parsePrice = (value, label, fallback) => {
  const numeric = value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`${label} must be a valid number greater than 0`);
  }
  return numeric;
};

const parseDiscountValue = (value, discountType, originalPrice, fallback = 0) => {
  if (discountType === "none") return 0;

  const numeric = value === undefined || value === null || value === "" ? Number.NaN : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error("discountValue is required when discountType is selected");
  }

  if (discountType === "percentage" && (numeric < 1 || numeric > 100)) {
    throw new Error("percentage discount must be between 1 and 100");
  }

  if (discountType === "fixed" && numeric > originalPrice) {
    throw new Error("fixed discount must not exceed original price");
  }

  return numeric;
};

const parsePriority = (value, fallback = 0) => {
  const numeric = value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error("priority must be numeric");
  }
  return numeric;
};

const parseDateValue = (value, field) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${field} must be a valid date`);
  }
  return parsed;
};

const validateCtaPair = (buttonText, buttonLink) => {
  if ((buttonText && !buttonLink) || (!buttonText && buttonLink)) {
    throw new Error("CTA button text and link must both be provided");
  }

  if (buttonLink && !isValidActionLink(buttonLink)) {
    throw new Error("CTA button link must be a valid internal path or URL");
  }
};

const serializeSlide = (slide) => ({
  ...slide,
  isCurrentlyVisible:
    slide.isActive
    && slide.availabilityStatus === "available"
    && isHeroSlideWithinSchedule(slide),
});

const applyHeroSlidePayload = (slide, payload, { isCreate = false } = {}) => {
  const title = sanitizeString(payload.title, slide.title || "");
  const category = sanitizeString(payload.category, slide.category || "");
  const imageUrl = sanitizeString(payload.imageUrl, slide.imageUrl || "");
  const description = sanitizeString(payload.description, slide.description || "");

  if (!title) {
    throw new Error("title is required");
  }

  if (!category) {
    throw new Error("category is required");
  }

  if (!imageUrl) {
    throw new Error("imageUrl is required");
  }

  if (description.length > 180) {
    throw new Error("description must be 180 characters or fewer");
  }

  const discountType = parseDiscountType(payload.discountType, slide.discountType || "none");
  const originalPrice = parsePrice(payload.originalPrice, "originalPrice", slide.originalPrice);
  const discountValue = parseDiscountValue(
    payload.discountValue,
    discountType,
    originalPrice,
    slide.discountValue ?? 0
  );
  const finalPrice = calculateHeroFinalPrice({ originalPrice, discountType, discountValue });
  const autoplaySeconds = parseAutoplaySeconds(payload.autoplaySeconds, slide.autoplaySeconds || 5);
  const priority = parsePriority(payload.priority, slide.priority || 0);
  const availabilityStatus = parseAvailabilityStatus(payload.availabilityStatus, slide.availabilityStatus || "available");
  const startDate = parseDateValue(payload.startDate, "startDate");
  const endDate = parseDateValue(payload.endDate, "endDate");
  const buttonText = sanitizeString(payload.buttonText, slide.buttonText || "");
  const buttonLink = sanitizeString(payload.buttonLink, slide.buttonLink || "");

  validateCtaPair(buttonText, buttonLink);

  if (startDate && endDate && startDate > endDate) {
    throw new Error("startDate must not be after endDate");
  }

  if (discountType !== "none" && finalPrice >= originalPrice) {
    throw new Error("finalPrice must be less than originalPrice when a discount exists");
  }

  slide.title = title;
  slide.description = description;
  slide.category = category;
  slide.imageUrl = imageUrl;
  slide.originalPrice = originalPrice;
  slide.discountType = discountType;
  slide.discountValue = discountValue;
  slide.finalPrice = finalPrice;
  slide.buttonText = buttonText;
  slide.buttonLink = buttonLink;
  slide.autoplaySeconds = autoplaySeconds;
  slide.isActive = parseOptionalBoolean(payload.isActive, isCreate ? true : slide.isActive);
  slide.priority = priority;
  slide.availabilityStatus = availabilityStatus;
  if (startDate !== undefined) slide.startDate = startDate;
  if (endDate !== undefined) slide.endDate = endDate;
};

export const listActiveHeroSlides = asyncHandler(async (req, res) => {
  const now = new Date();
  const items = await HeroSlide.find({
    isActive: true,
    availabilityStatus: "available",
  })
    .sort({ priority: -1, displayOrder: 1, createdAt: 1 })
    .lean();

  const visibleItems = items.filter((slide) => isHeroSlideWithinSchedule(slide, now));

  return res.json({ items: visibleItems.map(serializeSlide) });
});

export const adminListHeroSlides = asyncHandler(async (req, res) => {
  const items = await HeroSlide.find()
    .sort({ priority: -1, displayOrder: 1, createdAt: 1 })
    .lean();

  return res.json({ items: items.map(serializeSlide) });
});

export const createHeroSlide = asyncHandler(async (req, res) => {
  const currentMax = await HeroSlide.findOne().sort({ displayOrder: -1 }).select("displayOrder").lean();
  const slide = new HeroSlide({
    displayOrder: typeof currentMax?.displayOrder === "number" ? currentMax.displayOrder + 1 : 0,
  });

  applyHeroSlidePayload(slide, req.body, { isCreate: true });
  await slide.save();

  await writeAuditLog({
    actor: req.user,
    action: req.user.role === "hr" ? "hr.hero_slide_create" : "admin.hero_slide_create",
    entityType: "HeroSlide",
    entityId: slide._id,
    meta: {
      title: slide.title,
      isActive: slide.isActive,
      availabilityStatus: slide.availabilityStatus,
      priority: slide.priority,
      displayOrder: slide.displayOrder,
    },
  });

  return res.status(201).json({ item: serializeSlide(slide.toObject()) });
});

export const updateHeroSlide = asyncHandler(async (req, res) => {
  const slide = await HeroSlide.findById(req.params.id);
  if (!slide) {
    return res.status(404).json({ message: "Hero slide not found" });
  }

  const prev = {
    title: slide.title,
    isActive: slide.isActive,
    availabilityStatus: slide.availabilityStatus,
    priority: slide.priority,
    displayOrder: slide.displayOrder,
    autoplaySeconds: slide.autoplaySeconds,
    discountType: slide.discountType,
    discountValue: slide.discountValue,
    finalPrice: slide.finalPrice,
    startDate: slide.startDate,
    endDate: slide.endDate,
  };

  applyHeroSlidePayload(slide, req.body);
  await slide.save();

  await writeAuditLog({
    actor: req.user,
    action: req.user.role === "hr" ? "hr.hero_slide_update" : "admin.hero_slide_update",
    entityType: "HeroSlide",
    entityId: slide._id,
    meta: {
      prev,
      next: {
        title: slide.title,
        isActive: slide.isActive,
        availabilityStatus: slide.availabilityStatus,
        priority: slide.priority,
        displayOrder: slide.displayOrder,
        autoplaySeconds: slide.autoplaySeconds,
        discountType: slide.discountType,
        discountValue: slide.discountValue,
        finalPrice: slide.finalPrice,
        startDate: slide.startDate,
        endDate: slide.endDate,
      },
    },
  });

  return res.json({ item: serializeSlide(slide.toObject()) });
});

export const deleteHeroSlide = asyncHandler(async (req, res) => {
  const deleted = await HeroSlide.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Hero slide not found" });
  }

  await writeAuditLog({
    actor: req.user,
    action: req.user.role === "hr" ? "hr.hero_slide_delete" : "admin.hero_slide_delete",
    entityType: "HeroSlide",
    entityId: deleted._id,
    meta: { title: deleted.title, displayOrder: deleted.displayOrder, priority: deleted.priority },
  });

  const remaining = await HeroSlide.find().sort({ displayOrder: 1, createdAt: 1 });
  await Promise.all(
    remaining.map((entry, index) => HeroSlide.updateOne({ _id: entry._id }, { displayOrder: index }))
  );

  return res.json({ message: "Hero slide deleted" });
});

export const reorderHeroSlides = asyncHandler(async (req, res) => {
  const { orderedIds = [] } = req.body || {};

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ message: "orderedIds is required" });
  }

  const existing = await HeroSlide.find({ _id: { $in: orderedIds } }).select("_id").lean();
  if (existing.length !== orderedIds.length) {
    return res.status(400).json({ message: "orderedIds contains an invalid hero slide id" });
  }

  await Promise.all(
    orderedIds.map((id, index) => HeroSlide.updateOne({ _id: id }, { displayOrder: index }))
  );

  await writeAuditLog({
    actor: req.user,
    action: req.user.role === "hr" ? "hr.hero_slide_reorder" : "admin.hero_slide_reorder",
    entityType: "HeroSlide",
    entityId: "bulk",
    meta: { orderedIds },
  });

  const items = await HeroSlide.find().sort({ priority: -1, displayOrder: 1, createdAt: 1 }).lean();
  return res.json({ items: items.map(serializeSlide) });
});

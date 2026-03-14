import HomepageSection from "../models/HomepageSection.js";
import HomepageSectionItem from "../models/HomepageSectionItem.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../utils/audit.js";
import {
  ensureHomepageSections,
  HOMEPAGE_AVAILABILITY_STATUSES,
  HOMEPAGE_DEFAULT_SECTIONS,
  HOMEPAGE_ITEM_SECTION_KEYS,
  HOMEPAGE_SECTION_KEYS,
  isHomepageItemWithinSchedule,
  isValidHomepageActionLink,
  normalizeFooterLinks,
} from "../utils/homepageContent.js";
import { HERO_DISCOUNT_TYPES, calculateHeroFinalPrice } from "../utils/heroSlidePricing.js";

const sanitizeString = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

const getDefaultSection = (key) => HOMEPAGE_DEFAULT_SECTIONS.find((section) => section.key === key) || null;

const parseDisplayOrder = (value, fallback = 0) => {
  const numeric = value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error("displayOrder must be numeric");
  }
  return numeric;
};

const parseOptionalBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new Error("isActive must be boolean");
  return value;
};

const parseVisibility = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new Error("isVisible must be boolean");
  return value;
};

const parseSectionKey = (value) => {
  const next = sanitizeString(value).toLowerCase();
  if (!HOMEPAGE_SECTION_KEYS.includes(next)) {
    throw new Error("Invalid homepage section key");
  }
  return next;
};

const parseItemSectionKey = (value) => {
  const next = sanitizeString(value).toLowerCase();
  if (!HOMEPAGE_ITEM_SECTION_KEYS.includes(next)) {
    throw new Error("Invalid homepage item section key");
  }
  return next;
};

const parseAvailabilityStatus = (value, fallback = "available") => {
  const next = value === undefined || value === null || value === "" ? fallback : sanitizeString(value).toLowerCase();
  if (!HOMEPAGE_AVAILABILITY_STATUSES.includes(next)) {
    throw new Error("availabilityStatus must be available, unavailable, or out_of_stock");
  }
  return next;
};

const parseDiscountType = (value, fallback = "none") => {
  const next = value === undefined || value === null || value === "" ? fallback : sanitizeString(value).toLowerCase();
  if (!HERO_DISCOUNT_TYPES.includes(next)) {
    throw new Error("discountType must be none, percentage, or fixed");
  }
  return next;
};

const parsePrice = (value, label, fallback, { allowZero = false } = {}) => {
  const numeric = value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isFinite(numeric) || (allowZero ? numeric < 0 : numeric <= 0)) {
    throw new Error(`${label} must be a valid number ${allowZero ? "of 0 or greater" : "greater than 0"}`);
  }
  return numeric;
};

const parseDiscountValue = (value, discountType, originalPrice = 0) => {
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

const parseDateValue = (value, field) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${field} must be a valid date`);
  }
  return parsed;
};

const parseRating = (value, fallback) => {
  const numeric = value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isFinite(numeric) || numeric < 1 || numeric > 5) {
    throw new Error("rating must be between 1 and 5");
  }
  return numeric;
};

const validateActionPair = (buttonText, buttonLink) => {
  if ((buttonText && !buttonLink) || (!buttonText && buttonLink)) {
    throw new Error("CTA button text and CTA link must both be provided");
  }

  if (buttonLink && !isValidHomepageActionLink(buttonLink)) {
    throw new Error("CTA link must be a valid internal path or URL");
  }
};

const validateSocialLink = (value, field) => {
  if (value && !isValidHomepageActionLink(value)) {
    throw new Error(`${field} must be a valid URL`);
  }
};

const isItemVisibleNow = (item, now = new Date()) => {
  if (!item.isActive) return false;

  if (item.sectionKey === "featured-foods" && item.availabilityStatus !== "available") {
    return false;
  }

  if (item.sectionKey === "special-offers" && !isHomepageItemWithinSchedule(item, now)) {
    return false;
  }

  return true;
};

const serializeItem = (item) => ({
  ...item,
  isCurrentlyVisible: isItemVisibleNow(item),
});

const serializeSection = (section, items = []) => ({
  ...section,
  items: items.map(serializeItem),
});

const applySectionPayload = (section, payload) => {
  const defaultSection = getDefaultSection(section.key);
  const title = payload.title !== undefined ? sanitizeString(payload.title) : section.title || defaultSection?.title || "";
  const subtitle = payload.subtitle !== undefined ? sanitizeString(payload.subtitle) : section.subtitle || defaultSection?.subtitle || "";

  if (!title) {
    throw new Error("title is required");
  }

  if (subtitle.length > 240) {
    throw new Error("subtitle must be 240 characters or fewer");
  }

  section.title = title;
  section.subtitle = subtitle;
  section.isVisible = parseVisibility(payload.isVisible, section.isVisible);
  section.displayOrder = parseDisplayOrder(payload.displayOrder, section.displayOrder || defaultSection?.displayOrder || 0);

  if (section.key === "footer") {
    const existing = section.settings || {};
    const settings = {
      restaurantName: sanitizeString(payload?.settings?.restaurantName, existing.restaurantName || defaultSection?.settings?.restaurantName || ""),
      address: sanitizeString(payload?.settings?.address, existing.address || defaultSection?.settings?.address || ""),
      phone: sanitizeString(payload?.settings?.phone, existing.phone || defaultSection?.settings?.phone || ""),
      email: sanitizeString(payload?.settings?.email, existing.email || defaultSection?.settings?.email || ""),
      openingHours: sanitizeString(payload?.settings?.openingHours, existing.openingHours || defaultSection?.settings?.openingHours || ""),
      facebookUrl: sanitizeString(payload?.settings?.facebookUrl, existing.facebookUrl || defaultSection?.settings?.facebookUrl || ""),
      instagramUrl: sanitizeString(payload?.settings?.instagramUrl, existing.instagramUrl || defaultSection?.settings?.instagramUrl || ""),
      tiktokUrl: sanitizeString(payload?.settings?.tiktokUrl, existing.tiktokUrl || defaultSection?.settings?.tiktokUrl || ""),
      footerLinks: normalizeFooterLinks(payload?.settings?.footerLinks ?? existing.footerLinks ?? defaultSection?.settings?.footerLinks ?? []),
    };

    if (!settings.restaurantName || !settings.address || !settings.phone || !settings.email || !settings.openingHours) {
      throw new Error("restaurantName, address, phone, email, and openingHours are required");
    }

    validateSocialLink(settings.facebookUrl, "facebookUrl");
    validateSocialLink(settings.instagramUrl, "instagramUrl");
    validateSocialLink(settings.tiktokUrl, "tiktokUrl");

    for (const link of settings.footerLinks) {
      if (!isValidHomepageActionLink(link.href)) {
        throw new Error("footerLinks must contain valid links");
      }
    }

    section.settings = settings;
  }
};

const applyItemPayload = (item, payload, { isCreate = false } = {}) => {
  const sectionKey = parseItemSectionKey(item.sectionKey);
  const title = sanitizeString(payload.title, item.title || "");
  const description = sanitizeString(payload.description, item.description || "");
  const imageUrl = sanitizeString(payload.imageUrl, item.imageUrl || "");
  const icon = sanitizeString(payload.icon, item.icon || "");
  const labelText = sanitizeString(payload.labelText, item.labelText || "");
  const category = sanitizeString(payload.category, item.category || "");
  const buttonText = sanitizeString(payload.buttonText, item.buttonText || "");
  const buttonLink = sanitizeString(payload.buttonLink, item.buttonLink || "");
  const badgeText = sanitizeString(payload.badgeText, item.badgeText || "");
  const customerName = sanitizeString(payload.customerName, item.customerName || "");
  const customerImageUrl = sanitizeString(payload.customerImageUrl, item.customerImageUrl || "");
  const displayOrder = parseDisplayOrder(payload.displayOrder, item.displayOrder || 0);
  const isActive = parseOptionalBoolean(payload.isActive, isCreate ? true : item.isActive);

  if (description.length > 220) {
    throw new Error("description must be 220 characters or fewer");
  }

  validateActionPair(buttonText, buttonLink);

  item.displayOrder = displayOrder;
  item.isActive = isActive;

  switch (sectionKey) {
    case "categories": {
      if (!title) throw new Error("category name is required");
      if (!imageUrl && !icon) throw new Error("image or icon is required");

      item.title = title;
      item.description = description;
      item.imageUrl = imageUrl;
      item.icon = icon;
      item.labelText = labelText;
      item.category = "";
      item.originalPrice = 0;
      item.discountType = "none";
      item.discountValue = 0;
      item.finalPrice = 0;
      item.buttonText = "";
      item.buttonLink = "";
      item.availabilityStatus = "available";
      item.badgeText = "";
      item.customerName = "";
      item.customerImageUrl = "";
      item.rating = undefined;
      item.startDate = null;
      item.endDate = null;
      break;
    }

    case "featured-foods": {
      if (!title) throw new Error("food name is required");
      if (!imageUrl) throw new Error("image is required");
      if (!category) throw new Error("category is required");

      const originalPrice = parsePrice(payload.originalPrice, "originalPrice", item.originalPrice || 0);
      const discountType = parseDiscountType(payload.discountType, item.discountType || "none");
      const discountValue = parseDiscountValue(payload.discountValue, discountType, originalPrice);
      const finalPrice = calculateHeroFinalPrice({ originalPrice, discountType, discountValue });

      if (discountType !== "none" && finalPrice >= originalPrice) {
        throw new Error("finalPrice must be less than originalPrice when a discount exists");
      }

      item.title = title;
      item.description = description;
      item.imageUrl = imageUrl;
      item.icon = "";
      item.labelText = "";
      item.category = category;
      item.originalPrice = originalPrice;
      item.discountType = discountType;
      item.discountValue = discountValue;
      item.finalPrice = finalPrice;
      item.buttonText = buttonText;
      item.buttonLink = buttonLink;
      item.availabilityStatus = parseAvailabilityStatus(payload.availabilityStatus, item.availabilityStatus || "available");
      item.badgeText = "";
      item.customerName = "";
      item.customerImageUrl = "";
      item.rating = undefined;
      item.startDate = null;
      item.endDate = null;
      break;
    }

    case "special-offers": {
      if (!title) throw new Error("title is required");
      if (!imageUrl) throw new Error("image is required");

      const discountType = parseDiscountType(payload.discountType, item.discountType || "percentage");
      if (discountType === "none") {
        throw new Error("special offers require a discount type");
      }

      const discountValue = parseDiscountValue(payload.discountValue, discountType, 999999);
      const startDate = parseDateValue(payload.startDate, "startDate");
      const endDate = parseDateValue(payload.endDate, "endDate");

      if (startDate && endDate && startDate > endDate) {
        throw new Error("startDate must not be after endDate");
      }

      item.title = title;
      item.description = description;
      item.imageUrl = imageUrl;
      item.icon = "";
      item.labelText = "";
      item.category = "";
      item.originalPrice = 0;
      item.discountType = discountType;
      item.discountValue = discountValue;
      item.finalPrice = 0;
      item.buttonText = buttonText;
      item.buttonLink = buttonLink;
      item.availabilityStatus = "available";
      item.badgeText = "";
      item.customerName = "";
      item.customerImageUrl = "";
      item.rating = undefined;
      item.startDate = startDate;
      item.endDate = endDate;
      break;
    }

    case "why-choose-us": {
      if (!title) throw new Error("title is required");
      if (!description) throw new Error("description is required");
      if (!imageUrl && !icon) throw new Error("icon or image is required");

      item.title = title;
      item.description = description;
      item.imageUrl = imageUrl;
      item.icon = icon;
      item.labelText = "";
      item.category = "";
      item.originalPrice = 0;
      item.discountType = "none";
      item.discountValue = 0;
      item.finalPrice = 0;
      item.buttonText = "";
      item.buttonLink = "";
      item.availabilityStatus = "available";
      item.badgeText = "";
      item.customerName = "";
      item.customerImageUrl = "";
      item.rating = undefined;
      item.startDate = null;
      item.endDate = null;
      break;
    }

    case "best-sellers": {
      if (!title) throw new Error("food name is required");
      if (!imageUrl) throw new Error("image is required");

      const originalPrice = parsePrice(payload.originalPrice, "price", item.originalPrice || 0);

      item.title = title;
      item.description = description;
      item.imageUrl = imageUrl;
      item.icon = "";
      item.labelText = "";
      item.category = "";
      item.originalPrice = originalPrice;
      item.discountType = "none";
      item.discountValue = 0;
      item.finalPrice = originalPrice;
      item.buttonText = buttonText;
      item.buttonLink = buttonLink;
      item.availabilityStatus = "available";
      item.badgeText = badgeText;
      item.customerName = "";
      item.customerImageUrl = "";
      item.rating = undefined;
      item.startDate = null;
      item.endDate = null;
      break;
    }

    case "testimonials": {
      if (!customerName) throw new Error("customerName is required");
      if (!description) throw new Error("review text is required");

      item.title = customerName;
      item.description = description;
      item.imageUrl = "";
      item.icon = "";
      item.labelText = "";
      item.category = "";
      item.originalPrice = 0;
      item.discountType = "none";
      item.discountValue = 0;
      item.finalPrice = 0;
      item.buttonText = "";
      item.buttonLink = "";
      item.availabilityStatus = "available";
      item.badgeText = "";
      item.customerName = customerName;
      item.customerImageUrl = customerImageUrl;
      item.rating = parseRating(payload.rating, item.rating || 5);
      item.startDate = null;
      item.endDate = null;
      break;
    }

    default:
      throw new Error("Unsupported homepage section");
  }
};

const getAuditAction = (req, action) => (
  req.user.role === "hr" ? `hr.${action}` : `admin.${action}`
);

export const listHomepageContent = asyncHandler(async (req, res) => {
  await ensureHomepageSections();

  const sections = await HomepageSection.find({ isVisible: true }).sort({ displayOrder: 1, createdAt: 1 }).lean();
  const visibleKeys = sections.map((section) => section.key);
  const now = new Date();
  const items = await HomepageSectionItem.find({
    sectionKey: { $in: visibleKeys.filter((key) => key !== "footer") },
    isActive: true,
  })
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  const grouped = items.reduce((acc, item) => {
    if (!isItemVisibleNow(item, now)) return acc;
    acc[item.sectionKey] = acc[item.sectionKey] || [];
    acc[item.sectionKey].push(item);
    return acc;
  }, {});

  const payload = sections
    .map((section) => serializeSection(section, grouped[section.key] || []))
    .filter((section) => section.key === "footer" || section.items.length > 0);

  return res.json({ sections: payload });
});

export const adminListHomepageContent = asyncHandler(async (req, res) => {
  await ensureHomepageSections();

  const sections = await HomepageSection.find().sort({ displayOrder: 1, createdAt: 1 }).lean();
  const items = await HomepageSectionItem.find().sort({ displayOrder: 1, createdAt: 1 }).lean();

  const grouped = items.reduce((acc, item) => {
    acc[item.sectionKey] = acc[item.sectionKey] || [];
    acc[item.sectionKey].push(item);
    return acc;
  }, {});

  return res.json({
    sections: sections.map((section) => serializeSection(section, grouped[section.key] || [])),
  });
});

export const updateHomepageSection = asyncHandler(async (req, res) => {
  await ensureHomepageSections();

  const sectionKey = parseSectionKey(req.params.sectionKey);
  const section = await HomepageSection.findOne({ key: sectionKey });

  if (!section) {
    return res.status(404).json({ message: "Homepage section not found" });
  }

  const prev = {
    title: section.title,
    subtitle: section.subtitle,
    isVisible: section.isVisible,
    displayOrder: section.displayOrder,
    settings: section.settings,
  };

  applySectionPayload(section, req.body || {});
  await section.save();

  await writeAuditLog({
    actor: req.user,
    action: getAuditAction(req, "homepage_section_update"),
    entityType: "HomepageSection",
    entityId: section._id,
    meta: { key: section.key, prev, next: section.toObject() },
  });

  return res.json({ section: serializeSection(section.toObject()) });
});

export const reorderHomepageSections = asyncHandler(async (req, res) => {
  await ensureHomepageSections();

  const { orderedKeys = [] } = req.body || {};
  if (!Array.isArray(orderedKeys) || orderedKeys.length === 0) {
    return res.status(400).json({ message: "orderedKeys is required" });
  }

  const normalizedKeys = orderedKeys.map(parseSectionKey);
  const existing = await HomepageSection.find({ key: { $in: normalizedKeys } }).select("key").lean();
  if (existing.length !== normalizedKeys.length) {
    return res.status(400).json({ message: "orderedKeys contains an invalid section key" });
  }

  await Promise.all(
    normalizedKeys.map((key, index) => HomepageSection.updateOne({ key }, { displayOrder: index }))
  );

  await writeAuditLog({
    actor: req.user,
    action: getAuditAction(req, "homepage_section_reorder"),
    entityType: "HomepageSection",
    entityId: "bulk",
    meta: { orderedKeys: normalizedKeys },
  });

  const sections = await HomepageSection.find().sort({ displayOrder: 1, createdAt: 1 }).lean();
  return res.json({ sections: sections.map((section) => serializeSection(section)) });
});

export const createHomepageItem = asyncHandler(async (req, res) => {
  const sectionKey = parseItemSectionKey(req.params.sectionKey);
  await ensureHomepageSections();

  const currentMax = await HomepageSectionItem.findOne({ sectionKey }).sort({ displayOrder: -1 }).select("displayOrder").lean();
  const item = new HomepageSectionItem({
    sectionKey,
    displayOrder: typeof currentMax?.displayOrder === "number" ? currentMax.displayOrder + 1 : 0,
  });

  applyItemPayload(item, req.body || {}, { isCreate: true });
  await item.save();

  await writeAuditLog({
    actor: req.user,
    action: getAuditAction(req, "homepage_item_create"),
    entityType: "HomepageSectionItem",
    entityId: item._id,
    meta: { sectionKey, title: item.title, displayOrder: item.displayOrder },
  });

  return res.status(201).json({ item: serializeItem(item.toObject()) });
});

export const updateHomepageItem = asyncHandler(async (req, res) => {
  const item = await HomepageSectionItem.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ message: "Homepage item not found" });
  }

  const prev = {
    title: item.title,
    description: item.description,
    isActive: item.isActive,
    displayOrder: item.displayOrder,
    availabilityStatus: item.availabilityStatus,
  };

  applyItemPayload(item, req.body || {});
  await item.save();

  await writeAuditLog({
    actor: req.user,
    action: getAuditAction(req, "homepage_item_update"),
    entityType: "HomepageSectionItem",
    entityId: item._id,
    meta: { sectionKey: item.sectionKey, prev, next: item.toObject() },
  });

  return res.json({ item: serializeItem(item.toObject()) });
});

export const deleteHomepageItem = asyncHandler(async (req, res) => {
  const deleted = await HomepageSectionItem.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Homepage item not found" });
  }

  await writeAuditLog({
    actor: req.user,
    action: getAuditAction(req, "homepage_item_delete"),
    entityType: "HomepageSectionItem",
    entityId: deleted._id,
    meta: { sectionKey: deleted.sectionKey, title: deleted.title, displayOrder: deleted.displayOrder },
  });

  const remaining = await HomepageSectionItem.find({ sectionKey: deleted.sectionKey }).sort({ displayOrder: 1, createdAt: 1 });
  await Promise.all(
    remaining.map((entry, index) => HomepageSectionItem.updateOne({ _id: entry._id }, { displayOrder: index }))
  );

  return res.json({ message: "Homepage item deleted" });
});

export const reorderHomepageItems = asyncHandler(async (req, res) => {
  const sectionKey = parseItemSectionKey(req.params.sectionKey);
  const { orderedIds = [] } = req.body || {};

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ message: "orderedIds is required" });
  }

  const existing = await HomepageSectionItem.find({
    _id: { $in: orderedIds },
    sectionKey,
  })
    .select("_id")
    .lean();

  if (existing.length !== orderedIds.length) {
    return res.status(400).json({ message: "orderedIds contains an invalid homepage item id" });
  }

  await Promise.all(
    orderedIds.map((id, index) => HomepageSectionItem.updateOne({ _id: id }, { displayOrder: index }))
  );

  await writeAuditLog({
    actor: req.user,
    action: getAuditAction(req, "homepage_item_reorder"),
    entityType: "HomepageSectionItem",
    entityId: "bulk",
    meta: { sectionKey, orderedIds },
  });

  const items = await HomepageSectionItem.find({ sectionKey }).sort({ displayOrder: 1, createdAt: 1 }).lean();
  return res.json({ items: items.map(serializeItem) });
});

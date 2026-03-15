import AuthBranding from "../models/AuthBranding.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../utils/audit.js";

const AUTH_BRANDING_PAGE_TYPES = ["login", "register"];
const AUTH_BRANDING_TEXT_ALIGNMENTS = ["left", "center", "right"];

const sanitizeString = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

const isValidActionLink = (value) => /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value);

const parsePageType = (value) => {
  const next = String(value || "").trim().toLowerCase();
  if (!AUTH_BRANDING_PAGE_TYPES.includes(next)) {
    throw new Error("pageType must be login or register");
  }
  return next;
};

const parseOptionalBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new Error("isActive must be boolean");
  return value;
};

const parseOverlayOpacity = (value, fallback = 0.42) => {
  const numeric = value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0.12 || numeric > 0.88) {
    throw new Error("overlayOpacity must be between 0.12 and 0.88");
  }
  return Number(numeric.toFixed(2));
};

const parseTextAlignment = (value, fallback = "left") => {
  const next = value === undefined || value === null || value === "" ? fallback : String(value).trim().toLowerCase();
  if (!AUTH_BRANDING_TEXT_ALIGNMENTS.includes(next)) {
    throw new Error("textAlignment must be left, center, or right");
  }
  return next;
};

const validateCtaPair = (ctaText, ctaLink) => {
  if ((ctaText && !ctaLink) || (!ctaText && ctaLink)) {
    throw new Error("CTA text and CTA link must both be provided");
  }

  if (ctaLink && !isValidActionLink(ctaLink)) {
    throw new Error("CTA link must be a valid internal path or URL");
  }
};

const serializeBranding = (item) => ({
  _id: item._id,
  pageType: item.pageType,
  promoText: item.promoText || "",
  heading: item.heading,
  subheading: item.subheading || "",
  description: item.description || "",
  imageUrl: item.imageUrl || "",
  overlayOpacity: item.overlayOpacity,
  textAlignment: item.textAlignment,
  ctaText: item.ctaText || "",
  ctaLink: item.ctaLink || "",
  isActive: item.isActive !== false,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const applyAuthBrandingPayload = (item, payload, { isCreate = false } = {}) => {
  const promoText = sanitizeString(payload.promoText, item.promoText || "");
  const heading = sanitizeString(payload.heading, item.heading || "");
  const subheading = sanitizeString(payload.subheading, item.subheading || "");
  const description = sanitizeString(payload.description, item.description || "");
  const imageUrl = sanitizeString(payload.imageUrl, item.imageUrl || "");
  const ctaText = sanitizeString(payload.ctaText, item.ctaText || "");
  const ctaLink = sanitizeString(payload.ctaLink, item.ctaLink || "");

  if (!heading) {
    throw new Error("heading is required");
  }

  if (promoText.length > 40) {
    throw new Error("promoText must be 40 characters or fewer");
  }

  if (heading.length > 120) {
    throw new Error("heading must be 120 characters or fewer");
  }

  if (subheading.length > 180) {
    throw new Error("subheading must be 180 characters or fewer");
  }

  if (description.length > 240) {
    throw new Error("description must be 240 characters or fewer");
  }

  if (ctaText.length > 40) {
    throw new Error("ctaText must be 40 characters or fewer");
  }

  validateCtaPair(ctaText, ctaLink);

  item.promoText = promoText;
  item.heading = heading;
  item.subheading = subheading;
  item.description = description;
  item.imageUrl = imageUrl;
  item.overlayOpacity = parseOverlayOpacity(payload.overlayOpacity, item.overlayOpacity ?? 0.42);
  item.textAlignment = parseTextAlignment(payload.textAlignment, item.textAlignment || "left");
  item.ctaText = ctaText;
  item.ctaLink = ctaLink;
  item.isActive = parseOptionalBoolean(payload.isActive, isCreate ? true : item.isActive);
};

export const listActiveAuthBranding = asyncHandler(async (req, res) => {
  const items = await AuthBranding.find({ isActive: true }).sort({ pageType: 1 }).lean();
  return res.json({ items: items.map(serializeBranding) });
});

export const adminListAuthBranding = asyncHandler(async (req, res) => {
  const items = await AuthBranding.find().sort({ pageType: 1 }).lean();
  return res.json({ items: items.map(serializeBranding) });
});

export const upsertAuthBranding = asyncHandler(async (req, res) => {
  const pageType = parsePageType(req.params.pageType);
  const existing = await AuthBranding.findOne({ pageType });
  const item = existing || new AuthBranding({ pageType });

  const prev = existing
    ? {
      promoText: existing.promoText,
      heading: existing.heading,
      subheading: existing.subheading,
      description: existing.description,
      imageUrl: existing.imageUrl,
      overlayOpacity: existing.overlayOpacity,
      textAlignment: existing.textAlignment,
      ctaText: existing.ctaText,
      ctaLink: existing.ctaLink,
      isActive: existing.isActive,
    }
    : null;

  applyAuthBrandingPayload(item, req.body, { isCreate: !existing });
  await item.save();

  await writeAuditLog({
    actor: req.user,
    action: existing ? "admin.auth_branding_update" : "admin.auth_branding_create",
    entityType: "AuthBranding",
    entityId: item._id,
    meta: {
      pageType,
      prev,
      next: {
        promoText: item.promoText,
        heading: item.heading,
        subheading: item.subheading,
        description: item.description,
        hasImage: Boolean(item.imageUrl),
        overlayOpacity: item.overlayOpacity,
        textAlignment: item.textAlignment,
        ctaText: item.ctaText,
        ctaLink: item.ctaLink,
        isActive: item.isActive,
      },
    },
  });

  return res.json({ item: serializeBranding(item.toObject()) });
});

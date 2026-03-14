export const HERO_DISCOUNT_TYPES = ["none", "percentage", "fixed"];
export const HERO_AVAILABILITY_STATUSES = ["available", "unavailable", "out_of_stock"];
export const HERO_SLIDE_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=80";

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const clampDescription = (value) => String(value || "").trim().slice(0, 180);

const normalizeDateInput = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("-");
};

const isWithinSchedule = (slide, now = new Date()) => {
  const current = now instanceof Date ? now : new Date(now);
  const start = slide?.startDate ? new Date(slide.startDate) : null;
  const end = slide?.endDate ? new Date(slide.endDate) : null;

  if (start && !Number.isNaN(start.getTime())) {
    start.setHours(0, 0, 0, 0);
    if (current < start) return false;
  }

  if (end && !Number.isNaN(end.getTime())) {
    end.setHours(23, 59, 59, 999);
    if (current > end) return false;
  }

  return true;
};

export const isValidHeroActionLink = (value) => /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(String(value || "").trim());

export const computeHeroFinalPrice = (originalPrice, discountType = "none", discountValue = 0) => {
  const original = Math.max(0, toNumber(originalPrice, 0));
  const normalizedType = HERO_DISCOUNT_TYPES.includes(discountType) ? discountType : "none";
  const discount = Math.max(0, toNumber(discountValue, 0));

  if (normalizedType === "percentage") {
    return Number(Math.max(0, original - (original * Math.min(discount, 100)) / 100).toFixed(2));
  }

  if (normalizedType === "fixed") {
    return Number(Math.max(0, original - discount).toFixed(2));
  }

  return Number(original.toFixed(2));
};

export const formatHeroDiscountBadge = (slide) => {
  if (slide?.discountType === "percentage" && Number(slide.discountValue) > 0) {
    return `${Number(slide.discountValue)}% OFF`;
  }

  if (slide?.discountType === "fixed" && Number(slide.discountValue) > 0) {
    return `Save $${Number(slide.discountValue).toFixed(0)}`;
  }

  return "";
};

export const normalizeHeroSlide = (slide = {}, now = new Date()) => {
  const originalPrice = Math.max(0, toNumber(slide.originalPrice, 0));
  const discountType = HERO_DISCOUNT_TYPES.includes(slide.discountType) ? slide.discountType : "none";
  const discountValue = discountType === "none" ? 0 : Math.max(0, toNumber(slide.discountValue, 0));
  const finalPrice = computeHeroFinalPrice(originalPrice, discountType, discountValue);
  const availabilityStatus = HERO_AVAILABILITY_STATUSES.includes(slide.availabilityStatus)
    ? slide.availabilityStatus
    : "available";
  const hasDiscount = discountType !== "none" && discountValue > 0 && finalPrice < originalPrice;

  return {
    ...slide,
    id:
      slide.id
      || slide._id
      || (
        String(slide.title || "hero-slide")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
        || "hero-slide"
      ),
    title: String(slide.title || "").trim() || "Featured meal",
    description: clampDescription(slide.description),
    category: String(slide.category || "").trim() || "Featured offer",
    imageUrl: String(slide.imageUrl || "").trim() || HERO_SLIDE_FALLBACK_IMAGE,
    originalPrice,
    discountType,
    discountValue,
    finalPrice,
    hasDiscount,
    discountBadge: hasDiscount ? formatHeroDiscountBadge({ discountType, discountValue }) : "",
    buttonText: String(slide.buttonText || "").trim(),
    buttonLink: String(slide.buttonLink || "").trim(),
    autoplaySeconds: Math.min(20, Math.max(1, Math.round(toNumber(slide.autoplaySeconds, 5)) || 5)),
    isActive: slide.isActive !== false,
    availabilityStatus,
    priority: toNumber(slide.priority, 0),
    startDate: normalizeDateInput(slide.startDate),
    endDate: normalizeDateInput(slide.endDate),
    displayOrder: toNumber(slide.displayOrder, 0),
    isCurrentlyVisible: slide.isCurrentlyVisible ?? (
      slide.isActive !== false
      && availabilityStatus === "available"
      && isWithinSchedule(slide, now)
    ),
  };
};

export const createHeroSlideFormState = () => ({
  title: "",
  description: "",
  category: "",
  imageUrl: "",
  originalPrice: "",
  discountType: "none",
  discountValue: "",
  buttonText: "",
  buttonLink: "",
  autoplaySeconds: "5",
  isActive: true,
  priority: "0",
  availabilityStatus: "available",
  startDate: "",
  endDate: "",
});

export const toHeroSlideFormState = (slide = {}) => {
  const normalized = normalizeHeroSlide(slide);

  return {
    title: normalized.title,
    description: normalized.description,
    category: normalized.category,
    imageUrl: normalized.imageUrl === HERO_SLIDE_FALLBACK_IMAGE && !String(slide.imageUrl || "").trim() ? "" : normalized.imageUrl,
    originalPrice: normalized.originalPrice ? String(normalized.originalPrice) : "",
    discountType: normalized.discountType,
    discountValue: normalized.discountType === "none" ? "" : String(normalized.discountValue),
    buttonText: normalized.buttonText,
    buttonLink: normalized.buttonLink,
    autoplaySeconds: String(normalized.autoplaySeconds),
    isActive: normalized.isActive,
    priority: String(normalized.priority),
    availabilityStatus: normalized.availabilityStatus,
    startDate: normalized.startDate,
    endDate: normalized.endDate,
  };
};

export const validateHeroSlideForm = (form) => {
  const errors = [];
  const title = String(form.title || "").trim();
  const category = String(form.category || "").trim();
  const imageUrl = String(form.imageUrl || "").trim();
  const description = String(form.description || "").trim();
  const originalPrice = toNumber(form.originalPrice, Number.NaN);
  const discountType = HERO_DISCOUNT_TYPES.includes(form.discountType) ? form.discountType : "none";
  const discountValue = discountType === "none" ? 0 : toNumber(form.discountValue, Number.NaN);
  const autoplaySeconds = toNumber(form.autoplaySeconds, Number.NaN);
  const priority = toNumber(form.priority, Number.NaN);
  const buttonText = String(form.buttonText || "").trim();
  const buttonLink = String(form.buttonLink || "").trim();
  const availabilityStatus = HERO_AVAILABILITY_STATUSES.includes(form.availabilityStatus)
    ? form.availabilityStatus
    : "";
  const startDate = normalizeDateInput(form.startDate);
  const endDate = normalizeDateInput(form.endDate);
  const finalPrice = computeHeroFinalPrice(originalPrice, discountType, discountValue);

  if (!title) errors.push("Title is required.");
  if (!category) errors.push("Category is required.");
  if (!imageUrl) errors.push("Image is required.");
  if (description.length > 180) errors.push("Description must be 180 characters or fewer.");
  if (!Number.isFinite(originalPrice) || originalPrice <= 0) errors.push("Original price must be greater than 0.");
  if (!Number.isInteger(autoplaySeconds) || autoplaySeconds <= 0) errors.push("Autoplay seconds must be a whole number greater than 0.");
  if (!availabilityStatus) errors.push("Availability status is required.");
  if (!Number.isFinite(priority)) errors.push("Priority must be numeric.");

  if (discountType !== "none") {
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      errors.push("Discount value is required when a discount type is selected.");
    } else if (discountType === "percentage" && (discountValue < 1 || discountValue > 100)) {
      errors.push("Percentage discount must be between 1 and 100.");
    } else if (discountType === "fixed" && discountValue > originalPrice) {
      errors.push("Fixed discount must not exceed the original price.");
    }

    if (finalPrice < 0) errors.push("Final price must never be negative.");
    if (Number.isFinite(originalPrice) && finalPrice >= originalPrice) {
      errors.push("Final price must be less than the original price when a discount exists.");
    }
  }

  if ((buttonText && !buttonLink) || (!buttonText && buttonLink)) {
    errors.push("CTA button text and CTA link must both be provided.");
  } else if (buttonLink && !isValidHeroActionLink(buttonLink)) {
    errors.push("CTA link must be a valid internal path or URL.");
  }

  if (startDate && endDate && startDate > endDate) {
    errors.push("Start date must not be after end date.");
  }

  return errors;
};

export const buildHeroSlidePayload = (form) => {
  const discountType = HERO_DISCOUNT_TYPES.includes(form.discountType) ? form.discountType : "none";

  const payload = {
    title: String(form.title || "").trim(),
    description: clampDescription(form.description),
    category: String(form.category || "").trim(),
    imageUrl: String(form.imageUrl || "").trim(),
    originalPrice: toNumber(form.originalPrice, 0),
    discountType,
    discountValue: discountType === "none" ? 0 : toNumber(form.discountValue, 0),
    buttonText: String(form.buttonText || "").trim(),
    buttonLink: String(form.buttonLink || "").trim(),
    autoplaySeconds: Math.max(1, Math.round(toNumber(form.autoplaySeconds, 5)) || 5),
    isActive: Boolean(form.isActive),
    priority: toNumber(form.priority, 0),
    availabilityStatus: HERO_AVAILABILITY_STATUSES.includes(form.availabilityStatus)
      ? form.availabilityStatus
      : "available",
    startDate: normalizeDateInput(form.startDate) || null,
    endDate: normalizeDateInput(form.endDate) || null,
  };

  if (payload.discountType === "none") {
    payload.discountValue = 0;
  }

  if (!payload.buttonText && !payload.buttonLink) {
    payload.buttonText = "";
    payload.buttonLink = "";
  }

  return payload;
};

import {
  computeHeroFinalPrice,
  HERO_SLIDE_FALLBACK_IMAGE,
  isValidHeroActionLink,
} from "./heroSlides";

export const HOMEPAGE_SECTION_DEFINITIONS = [
  {
    key: "categories",
    label: "Popular Categories",
    defaultTitle: "Popular Categories",
    defaultSubtitle: "Browse the most ordered parts of the menu at a glance.",
    emptyTitle: "No category cards yet",
    emptyText: "Add active category cards to populate this homepage section.",
  },
  {
    key: "featured-foods",
    label: "Featured Foods",
    defaultTitle: "Featured Foods",
    defaultSubtitle: "High-conversion dishes worth placing near the top of the homepage.",
    emptyTitle: "No featured foods yet",
    emptyText: "Add active, available food cards to populate this section.",
  },
  {
    key: "special-offers",
    label: "Today's Deals",
    defaultTitle: "Today's Deals",
    defaultSubtitle: "Time-bound offers that should stand out immediately.",
    emptyTitle: "No active offers yet",
    emptyText: "Add active offers with valid dates to show them on the homepage.",
  },
  {
    key: "why-choose-us",
    label: "Why Choose Us",
    defaultTitle: "Why Choose Us",
    defaultSubtitle: "Short trust signals that explain why customers should order here.",
    emptyTitle: "No trust cards yet",
    emptyText: "Add active reason cards to explain your restaurant’s value.",
  },
  {
    key: "best-sellers",
    label: "Chef Recommendations",
    defaultTitle: "Chef Recommendations",
    defaultSubtitle: "Premium best sellers and chef-picked meals with stronger emphasis.",
    emptyTitle: "No best sellers yet",
    emptyText: "Add active best-seller or chef-pick cards to populate this section.",
  },
  {
    key: "testimonials",
    label: "Customer Reviews",
    defaultTitle: "Customer Reviews",
    defaultSubtitle: "Short, credible feedback that reinforces trust before checkout.",
    emptyTitle: "No testimonials yet",
    emptyText: "Add active reviews to show social proof on the homepage.",
  },
  {
    key: "footer",
    label: "Contact / Footer",
    defaultTitle: "Contact Us",
    defaultSubtitle: "Keep contact details easy to find and consistent across the site.",
    emptyTitle: "Footer details missing",
    emptyText: "Update the footer/contact details to complete the homepage.",
  },
];

export const HOMEPAGE_ITEM_SECTION_KEYS = HOMEPAGE_SECTION_DEFINITIONS
  .map((section) => section.key)
  .filter((key) => key !== "footer");

export const HOMEPAGE_AVAILABILITY_STATUSES = ["available", "unavailable", "out_of_stock"];

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

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

const clampText = (value, limit = 220) => String(value || "").trim().slice(0, limit);

const getSectionDefinition = (key) => HOMEPAGE_SECTION_DEFINITIONS.find((section) => section.key === key);

export const formatHomepageDiscountBadge = (item) => {
  if (item.discountType === "percentage" && Number(item.discountValue) > 0) {
    return `${Number(item.discountValue)}% OFF`;
  }

  if (item.discountType === "fixed" && Number(item.discountValue) > 0) {
    return `Save $${Number(item.discountValue).toFixed(0)}`;
  }

  return "";
};

const isItemVisibleNow = (sectionKey, item, now = new Date()) => {
  if (!item.isActive) return false;

  if (sectionKey === "featured-foods" && item.availabilityStatus !== "available") {
    return false;
  }

  if (sectionKey === "special-offers") {
    const current = now instanceof Date ? now : new Date(now);
    const start = item.startDate ? new Date(item.startDate) : null;
    const end = item.endDate ? new Date(item.endDate) : null;

    if (start && !Number.isNaN(start.getTime())) {
      start.setHours(0, 0, 0, 0);
      if (current < start) return false;
    }

    if (end && !Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      if (current > end) return false;
    }
  }

  return true;
};

export const normalizeHomepageItem = (sectionKey, item = {}, now = new Date()) => {
  const originalPrice = Math.max(0, toNumber(item.originalPrice, 0));
  const discountType = ["none", "percentage", "fixed"].includes(item.discountType) ? item.discountType : "none";
  const discountValue = discountType === "none" ? 0 : Math.max(0, toNumber(item.discountValue, 0));
  const finalPrice = (() => {
    if (sectionKey === "featured-foods") {
      return computeHeroFinalPrice(originalPrice, discountType, discountValue);
    }

    if (sectionKey === "best-sellers") {
      return Number(originalPrice.toFixed(2));
    }

    return Math.max(0, toNumber(item.finalPrice, 0));
  })();
  const hasDiscount = sectionKey === "featured-foods" && discountType !== "none" && finalPrice < originalPrice;
  const resolvedImageUrl = (() => {
    const raw = String(item.imageUrl || item.customerImageUrl || "").trim();
    if (raw) return raw;
    if (["featured-foods", "special-offers", "best-sellers"].includes(sectionKey)) {
      return HERO_SLIDE_FALLBACK_IMAGE;
    }
    return "";
  })();

  const normalized = {
    ...item,
    id: item.id || item._id || `${sectionKey}-${item.title || item.customerName || "item"}`,
    title: clampText(item.title || item.customerName || "", 120),
    description: clampText(item.description, 220),
    imageUrl: resolvedImageUrl,
    icon: String(item.icon || "").trim(),
    labelText: clampText(item.labelText, 80),
    category: clampText(item.category, 80),
    originalPrice,
    discountType,
    discountValue,
    finalPrice,
    hasDiscount,
    discountBadge: sectionKey === "special-offers" || sectionKey === "featured-foods"
      ? formatHomepageDiscountBadge({ discountType, discountValue })
      : "",
    buttonText: String(item.buttonText || "").trim(),
    buttonLink: String(item.buttonLink || "").trim(),
    availabilityStatus: HOMEPAGE_AVAILABILITY_STATUSES.includes(item.availabilityStatus)
      ? item.availabilityStatus
      : "available",
    badgeText: clampText(item.badgeText, 40),
    customerName: clampText(item.customerName, 80),
    customerImageUrl: String(item.customerImageUrl || "").trim(),
    rating: Math.min(5, Math.max(1, Math.round(toNumber(item.rating, 5)))),
    startDate: normalizeDateInput(item.startDate),
    endDate: normalizeDateInput(item.endDate),
    isActive: item.isActive !== false,
    displayOrder: toNumber(item.displayOrder, 0),
  };

  return {
    ...normalized,
    isCurrentlyVisible: item.isCurrentlyVisible ?? isItemVisibleNow(sectionKey, normalized, now),
  };
};

export const normalizeHomepageSection = (section = {}, now = new Date()) => {
  const definition = getSectionDefinition(section.key) || {};
  const items = Array.isArray(section.items)
    ? section.items
      .map((item) => normalizeHomepageItem(section.key, item, now))
      .sort((a, b) => a.displayOrder - b.displayOrder)
    : [];

  return {
    ...section,
    key: section.key,
    label: definition.label || section.key,
    title: String(section.title || definition.defaultTitle || "").trim(),
    subtitle: clampText(section.subtitle || definition.defaultSubtitle || "", 240),
    isVisible: section.isVisible !== false,
    displayOrder: toNumber(section.displayOrder, 0),
    settings: {
      restaurantName: String(section.settings?.restaurantName || "").trim(),
      address: String(section.settings?.address || "").trim(),
      phone: String(section.settings?.phone || "").trim(),
      email: String(section.settings?.email || "").trim(),
      openingHours: String(section.settings?.openingHours || "").trim(),
      facebookUrl: String(section.settings?.facebookUrl || "").trim(),
      instagramUrl: String(section.settings?.instagramUrl || "").trim(),
      tiktokUrl: String(section.settings?.tiktokUrl || "").trim(),
      footerLinks: Array.isArray(section.settings?.footerLinks)
        ? section.settings.footerLinks
          .map((entry) => ({
            label: String(entry?.label || "").trim(),
            href: String(entry?.href || "").trim(),
          }))
          .filter((entry) => entry.label && entry.href)
        : [],
    },
    items,
    emptyTitle: definition.emptyTitle || "No items",
    emptyText: definition.emptyText || "Add content for this section.",
  };
};

export const normalizeHomepageContent = (payload = {}) => {
  const sections = Array.isArray(payload.sections)
    ? payload.sections.map((section) => normalizeHomepageSection(section)).sort((a, b) => a.displayOrder - b.displayOrder)
    : [];

  return {
    sections,
    sectionsByKey: sections.reduce((acc, section) => {
      acc[section.key] = section;
      return acc;
    }, {}),
  };
};

export const createHomepageSectionForm = (sectionKey, section = {}) => {
  const definition = getSectionDefinition(sectionKey);

  return {
    title: String(section.title || definition?.defaultTitle || "").trim(),
    subtitle: String(section.subtitle || definition?.defaultSubtitle || "").trim(),
    isVisible: section.isVisible !== false,
    displayOrder: String(section.displayOrder ?? 0),
    settings: {
      restaurantName: String(section.settings?.restaurantName || "").trim(),
      address: String(section.settings?.address || "").trim(),
      phone: String(section.settings?.phone || "").trim(),
      email: String(section.settings?.email || "").trim(),
      openingHours: String(section.settings?.openingHours || "").trim(),
      facebookUrl: String(section.settings?.facebookUrl || "").trim(),
      instagramUrl: String(section.settings?.instagramUrl || "").trim(),
      tiktokUrl: String(section.settings?.tiktokUrl || "").trim(),
      footerLinks: Array.isArray(section.settings?.footerLinks) && section.settings.footerLinks.length
        ? section.settings.footerLinks.map((entry) => ({
          label: String(entry?.label || "").trim(),
          href: String(entry?.href || "").trim(),
        }))
        : [{ label: "", href: "" }],
    },
  };
};

export const validateHomepageSectionForm = (sectionKey, form) => {
  const errors = [];

  if (!String(form.title || "").trim()) {
    errors.push("Section title is required.");
  }

  if (!Number.isFinite(toNumber(form.displayOrder, Number.NaN))) {
    errors.push("Section order must be numeric.");
  }

  if (String(form.subtitle || "").trim().length > 240) {
    errors.push("Section subtitle must be 240 characters or fewer.");
  }

  if (sectionKey === "footer") {
    const settings = form.settings || {};

    if (!String(settings.restaurantName || "").trim()) errors.push("Restaurant name is required.");
    if (!String(settings.address || "").trim()) errors.push("Address is required.");
    if (!String(settings.phone || "").trim()) errors.push("Phone number is required.");
    if (!String(settings.email || "").trim()) errors.push("Email is required.");
    if (!String(settings.openingHours || "").trim()) errors.push("Opening hours are required.");

    ["facebookUrl", "instagramUrl", "tiktokUrl"].forEach((field) => {
      const value = String(settings[field] || "").trim();
      if (value && !isValidHeroActionLink(value)) {
        errors.push(`${field} must be a valid URL.`);
      }
    });

    (settings.footerLinks || []).forEach((entry) => {
      const hasOne = String(entry?.label || "").trim() || String(entry?.href || "").trim();
      if (!hasOne) return;

      if (!String(entry?.label || "").trim() || !String(entry?.href || "").trim()) {
        errors.push("Footer links must include both label and link.");
      } else if (!isValidHeroActionLink(entry.href)) {
        errors.push("Footer links must use valid URLs or internal paths.");
      }
    });
  }

  return errors;
};

export const buildHomepageSectionPayload = (sectionKey, form) => ({
  title: String(form.title || "").trim(),
  subtitle: clampText(form.subtitle, 240),
  isVisible: Boolean(form.isVisible),
  displayOrder: toNumber(form.displayOrder, 0),
  settings: sectionKey === "footer"
    ? {
      restaurantName: String(form.settings?.restaurantName || "").trim(),
      address: String(form.settings?.address || "").trim(),
      phone: String(form.settings?.phone || "").trim(),
      email: String(form.settings?.email || "").trim(),
      openingHours: String(form.settings?.openingHours || "").trim(),
      facebookUrl: String(form.settings?.facebookUrl || "").trim(),
      instagramUrl: String(form.settings?.instagramUrl || "").trim(),
      tiktokUrl: String(form.settings?.tiktokUrl || "").trim(),
      footerLinks: (form.settings?.footerLinks || [])
        .map((entry) => ({
          label: String(entry?.label || "").trim(),
          href: String(entry?.href || "").trim(),
        }))
        .filter((entry) => entry.label && entry.href),
    }
    : undefined,
});

export const createHomepageItemForm = (sectionKey) => ({
  title: "",
  description: "",
  imageUrl: "",
  icon: "",
  labelText: "",
  category: "",
  originalPrice: "",
  discountType: sectionKey === "special-offers" ? "percentage" : "none",
  discountValue: "",
  buttonText: "",
  buttonLink: "",
  availabilityStatus: "available",
  badgeText: sectionKey === "best-sellers" ? "Chef Pick" : "",
  customerName: "",
  customerImageUrl: "",
  rating: "5",
  startDate: "",
  endDate: "",
  isActive: true,
  displayOrder: "0",
});

export const toHomepageItemForm = (sectionKey, item = {}) => {
  const normalized = normalizeHomepageItem(sectionKey, item);

  return {
    title: normalized.title,
    description: normalized.description,
    imageUrl: sectionKey === "testimonials" ? "" : normalized.imageUrl === HERO_SLIDE_FALLBACK_IMAGE && !item.imageUrl ? "" : normalized.imageUrl,
    icon: normalized.icon,
    labelText: normalized.labelText,
    category: normalized.category,
    originalPrice: normalized.originalPrice ? String(normalized.originalPrice) : "",
    discountType: normalized.discountType,
    discountValue: normalized.discountType === "none" ? "" : String(normalized.discountValue),
    buttonText: normalized.buttonText,
    buttonLink: normalized.buttonLink,
    availabilityStatus: normalized.availabilityStatus,
    badgeText: normalized.badgeText,
    customerName: normalized.customerName,
    customerImageUrl: normalized.customerImageUrl,
    rating: String(normalized.rating || 5),
    startDate: normalized.startDate,
    endDate: normalized.endDate,
    isActive: normalized.isActive,
    displayOrder: String(normalized.displayOrder),
  };
};

export const validateHomepageItemForm = (sectionKey, form) => {
  const errors = [];
  const title = String(form.title || "").trim();
  const description = String(form.description || "").trim();
  const imageUrl = String(form.imageUrl || "").trim();
  const icon = String(form.icon || "").trim();
  const category = String(form.category || "").trim();
  const originalPrice = toNumber(form.originalPrice, Number.NaN);
  const discountType = ["none", "percentage", "fixed"].includes(form.discountType) ? form.discountType : "none";
  const discountValue = discountType === "none" ? 0 : toNumber(form.discountValue, Number.NaN);
  const displayOrder = toNumber(form.displayOrder, Number.NaN);
  const rating = toNumber(form.rating, Number.NaN);
  const startDate = normalizeDateInput(form.startDate);
  const endDate = normalizeDateInput(form.endDate);
  const buttonText = String(form.buttonText || "").trim();
  const buttonLink = String(form.buttonLink || "").trim();

  if (!Number.isFinite(displayOrder)) {
    errors.push("Sort order must be numeric.");
  }

  if ((buttonText && !buttonLink) || (!buttonText && buttonLink)) {
    errors.push("CTA button text and CTA link must both be provided.");
  } else if (buttonLink && !isValidHeroActionLink(buttonLink)) {
    errors.push("CTA link must be a valid internal path or URL.");
  }

  if (description.length > 220) {
    errors.push("Description must be 220 characters or fewer.");
  }

  switch (sectionKey) {
    case "categories":
      if (!title) errors.push("Category name is required.");
      if (!imageUrl && !icon) errors.push("Category image or icon is required.");
      break;

    case "featured-foods": {
      if (!title) errors.push("Food name is required.");
      if (!imageUrl) errors.push("Food image is required.");
      if (!category) errors.push("Category is required.");
      if (!Number.isFinite(originalPrice) || originalPrice <= 0) errors.push("Original price must be greater than 0.");
      if (!HOMEPAGE_AVAILABILITY_STATUSES.includes(form.availabilityStatus)) errors.push("Availability status is required.");

      if (discountType !== "none") {
        if (!Number.isFinite(discountValue) || discountValue <= 0) {
          errors.push("Discount value is required when a discount type is selected.");
        } else if (discountType === "percentage" && (discountValue < 1 || discountValue > 100)) {
          errors.push("Percentage discount must be between 1 and 100.");
        } else if (discountType === "fixed" && discountValue > originalPrice) {
          errors.push("Fixed discount must not exceed the original price.");
        }

        const finalPrice = computeHeroFinalPrice(originalPrice, discountType, discountValue);
        if (finalPrice < 0) errors.push("Final price must never be negative.");
        if (Number.isFinite(originalPrice) && finalPrice >= originalPrice) {
          errors.push("Final price must be less than the original price when a discount exists.");
        }
      }
      break;
    }

    case "special-offers":
      if (!title) errors.push("Offer title is required.");
      if (!imageUrl) errors.push("Offer image is required.");
      if (discountType === "none") {
        errors.push("Special offers require a discount type.");
      } else if (!Number.isFinite(discountValue) || discountValue <= 0) {
        errors.push("Discount value is required.");
      } else if (discountType === "percentage" && (discountValue < 1 || discountValue > 100)) {
        errors.push("Percentage discount must be between 1 and 100.");
      }
      if (startDate && endDate && startDate > endDate) errors.push("Start date must not be after end date.");
      break;

    case "why-choose-us":
      if (!title) errors.push("Title is required.");
      if (!description) errors.push("Description is required.");
      if (!imageUrl && !icon) errors.push("Icon or image is required.");
      break;

    case "best-sellers":
      if (!title) errors.push("Food name is required.");
      if (!imageUrl) errors.push("Image is required.");
      if (!Number.isFinite(originalPrice) || originalPrice <= 0) errors.push("Price must be greater than 0.");
      break;

    case "testimonials":
      if (!String(form.customerName || "").trim()) errors.push("Customer name is required.");
      if (!description) errors.push("Review text is required.");
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) errors.push("Rating must be between 1 and 5.");
      break;

    default:
      break;
  }

  return errors;
};

export const buildHomepageItemPayload = (sectionKey, form) => ({
  title: String(form.title || "").trim(),
  description: clampText(form.description, 220),
  imageUrl: String(form.imageUrl || "").trim(),
  icon: String(form.icon || "").trim(),
  labelText: String(form.labelText || "").trim(),
  category: String(form.category || "").trim(),
  originalPrice: form.originalPrice === "" ? 0 : toNumber(form.originalPrice, 0),
  discountType: ["none", "percentage", "fixed"].includes(form.discountType) ? form.discountType : "none",
  discountValue: form.discountType === "none" || form.discountValue === "" ? 0 : toNumber(form.discountValue, 0),
  buttonText: String(form.buttonText || "").trim(),
  buttonLink: String(form.buttonLink || "").trim(),
  availabilityStatus: HOMEPAGE_AVAILABILITY_STATUSES.includes(form.availabilityStatus)
    ? form.availabilityStatus
    : "available",
  badgeText: String(form.badgeText || "").trim(),
  customerName: String(form.customerName || "").trim(),
  customerImageUrl: String(form.customerImageUrl || "").trim(),
  rating: toNumber(form.rating, 5),
  startDate: normalizeDateInput(form.startDate) || null,
  endDate: normalizeDateInput(form.endDate) || null,
  isActive: Boolean(form.isActive),
  displayOrder: toNumber(form.displayOrder, 0),
  sectionKey,
});

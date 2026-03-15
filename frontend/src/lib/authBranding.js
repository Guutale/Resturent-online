export const AUTH_BRANDING_PAGE_TYPES = ["login", "register"];
export const AUTH_BRANDING_TEXT_ALIGNMENTS = ["left", "center", "right"];
const AUTH_BRANDING_MAX_IMAGE_CHARS = 2_200_000;

export const AUTH_BRANDING_PAGE_META = {
  login: {
    label: "Login Page Branding",
    shortLabel: "Login",
    heroLabel: "Member sign in",
    fallbackPromoText: "Service that remembers your pace",
    fallbackHeading: (restaurantName) => `Return to ${restaurantName} without losing the rhythm.`,
    fallbackSubheading: "Track orders, catch updates early, and step back into the right dashboard in seconds.",
    fallbackDescription:
      "A calmer front door for customers and staff, with premium visuals, cleaner form spacing, and the same warm tone as the main restaurant site.",
    fallbackImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
    defaultHighlights: [
      {
        icon: "fa-solid fa-box-open",
        title: "Order flow clarity",
        text: "Track payment, kitchen, and delivery status from one place.",
      },
      {
        icon: "fa-solid fa-bell-concierge",
        title: "Faster service cues",
        text: "Unread updates and operational notices stay visible after sign in.",
      },
      {
        icon: "fa-solid fa-location-arrow",
        title: "Portal-aware routing",
        text: "Staff accounts land in the correct workspace automatically.",
      },
    ],
  },
  register: {
    label: "Registration Page Branding",
    shortLabel: "Register",
    heroLabel: "Guest onboarding",
    fallbackPromoText: "A smoother first order starts here",
    fallbackHeading: (restaurantName) => `Create your ${restaurantName} account with a more polished first impression.`,
    fallbackSubheading: "Save delivery details, move through checkout faster, and keep every future order connected.",
    fallbackDescription:
      "The same premium visual language as the restaurant homepage, adapted for conversion-focused account creation on desktop and mobile.",
    fallbackImage:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80",
    defaultHighlights: [
      {
        icon: "fa-solid fa-credit-card",
        title: "Quicker checkout",
        text: "Keep your profile ready for faster repeat orders and easier confirmations.",
      },
      {
        icon: "fa-solid fa-receipt",
        title: "Persistent history",
        text: "Invoices, order updates, and notifications stay tied to one account.",
      },
      {
        icon: "fa-solid fa-phone",
        title: "Direct contact details",
        text: "Add your phone once so support and delivery coordination stay simple.",
      },
    ],
  },
};

const clampString = (value, limit) => String(value || "").trim().slice(0, limit);

const clampNumber = (value, fallback, min, max) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
};

export const isValidAuthActionLink = (value) => /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(String(value || "").trim());

const resolvePageType = (pageType) => AUTH_BRANDING_PAGE_TYPES.includes(pageType) ? pageType : "login";

export const getAuthBrandingPageMeta = (pageType) => AUTH_BRANDING_PAGE_META[resolvePageType(pageType)];

export const getFallbackAuthBranding = (pageType, { restaurantName = "Flavor Point" } = {}) => {
  const resolvedPageType = resolvePageType(pageType);
  const meta = getAuthBrandingPageMeta(resolvedPageType);
  const resolvedRestaurantName = String(restaurantName || "").trim() || "Flavor Point";

  return {
    _id: "",
    pageType: resolvedPageType,
    promoText: meta.fallbackPromoText,
    heading: meta.fallbackHeading(resolvedRestaurantName),
    subheading: meta.fallbackSubheading,
    description: meta.fallbackDescription,
    imageUrl: meta.fallbackImage,
    overlayOpacity: resolvedPageType === "login" ? 0.46 : 0.38,
    textAlignment: "left",
    ctaText: "Browse menu",
    ctaLink: "/menu",
    isActive: true,
    updatedAt: "",
    hasCustomImage: false,
    isFallback: true,
  };
};

export const normalizeAuthBranding = (item = {}, pageType = item.pageType) => {
  const resolvedPageType = resolvePageType(pageType || item.pageType);
  const rawImageUrl = String(item.imageUrl || "").trim();

  return {
    _id: item._id || "",
    pageType: resolvedPageType,
    promoText: clampString(item.promoText, 40),
    heading: clampString(item.heading, 120),
    subheading: clampString(item.subheading, 180),
    description: clampString(item.description, 240),
    imageUrl: rawImageUrl,
    overlayOpacity: Number(clampNumber(item.overlayOpacity, 0.42, 0.12, 0.88).toFixed(2)),
    textAlignment: AUTH_BRANDING_TEXT_ALIGNMENTS.includes(item.textAlignment)
      ? item.textAlignment
      : "left",
    ctaText: clampString(item.ctaText, 40),
    ctaLink: String(item.ctaLink || "").trim(),
    isActive: item.isActive !== false,
    updatedAt: String(item.updatedAt || "").trim(),
    hasCustomImage: Boolean(rawImageUrl),
    isFallback: false,
  };
};

export const normalizeAuthBrandingCollection = (payload = {}) => {
  const items = Array.isArray(payload.items)
    ? payload.items
      .map((item) => normalizeAuthBranding(item, item.pageType))
      .sort((left, right) => left.pageType.localeCompare(right.pageType))
    : [];

  return {
    items,
    itemsByPageType: items.reduce((acc, item) => {
      acc[item.pageType] = item;
      return acc;
    }, {}),
  };
};

export const resolvePublicAuthBranding = (item, pageType, options = {}) => {
  const fallback = getFallbackAuthBranding(pageType, options);
  if (!item || item.isActive === false) return fallback;

  const normalized = normalizeAuthBranding(item, pageType);
  return {
    ...fallback,
    ...normalized,
    heading: normalized.heading || fallback.heading,
    imageUrl: normalized.imageUrl || fallback.imageUrl,
    hasCustomImage: Boolean(normalized.imageUrl),
    isFallback: false,
  };
};

export const resolvePreviewAuthBranding = (item, pageType, options = {}) => {
  const fallback = getFallbackAuthBranding(pageType, options);
  const normalized = normalizeAuthBranding(item, pageType);
  const hasPreviewContent = Boolean(
    normalized.heading
    || normalized.subheading
    || normalized.description
    || normalized.imageUrl
    || normalized.promoText
  );

  if (!hasPreviewContent) {
    return {
      ...fallback,
      isActive: normalized.isActive,
      overlayOpacity: normalized.overlayOpacity,
      textAlignment: normalized.textAlignment,
    };
  }

  return {
    ...fallback,
    ...normalized,
    heading: normalized.heading || fallback.heading,
    subheading: normalized.subheading || fallback.subheading,
    description: normalized.description || fallback.description,
    promoText: normalized.promoText || fallback.promoText,
    imageUrl: normalized.imageUrl || fallback.imageUrl,
    hasCustomImage: Boolean(normalized.imageUrl),
    isFallback: false,
  };
};

export const createAuthBrandingForm = (pageType = "login") => ({
  pageType: resolvePageType(pageType),
  promoText: "",
  heading: "",
  subheading: "",
  description: "",
  imageUrl: "",
  overlayOpacity: "0.42",
  textAlignment: "left",
  ctaText: "",
  ctaLink: "",
  isActive: true,
});

export const toAuthBrandingForm = (pageType, item = {}) => {
  const normalized = normalizeAuthBranding(item, pageType);

  return {
    pageType: normalized.pageType,
    promoText: normalized.promoText,
    heading: normalized.heading,
    subheading: normalized.subheading,
    description: normalized.description,
    imageUrl: normalized.imageUrl,
    overlayOpacity: normalized.overlayOpacity.toFixed(2),
    textAlignment: normalized.textAlignment,
    ctaText: normalized.ctaText,
    ctaLink: normalized.ctaLink,
    isActive: normalized.isActive,
  };
};

export const validateAuthBrandingForm = (form) => {
  const errors = [];
  const promoText = clampString(form.promoText, 40);
  const heading = clampString(form.heading, 120);
  const subheading = clampString(form.subheading, 180);
  const description = clampString(form.description, 240);
  const ctaText = clampString(form.ctaText, 40);
  const ctaLink = String(form.ctaLink || "").trim();
  const overlayOpacity = Number(form.overlayOpacity);

  if (!heading) errors.push("Heading is required.");
  if (promoText.length > 40) errors.push("Promo text must be 40 characters or fewer.");
  if (subheading.length > 180) errors.push("Subheading must be 180 characters or fewer.");
  if (description.length > 240) errors.push("Description must be 240 characters or fewer.");
  if (ctaText.length > 40) errors.push("CTA text must be 40 characters or fewer.");
  if (!Number.isFinite(overlayOpacity) || overlayOpacity < 0.12 || overlayOpacity > 0.88) {
    errors.push("Overlay opacity must stay between 0.12 and 0.88.");
  }
  if ((ctaText && !ctaLink) || (!ctaText && ctaLink)) {
    errors.push("CTA text and CTA link must both be provided.");
  } else if (ctaLink && !isValidAuthActionLink(ctaLink)) {
    errors.push("CTA link must be a valid internal path or URL.");
  }

  return errors;
};

export const buildAuthBrandingPayload = (form) => ({
  promoText: clampString(form.promoText, 40),
  heading: clampString(form.heading, 120),
  subheading: clampString(form.subheading, 180),
  description: clampString(form.description, 240),
  imageUrl: String(form.imageUrl || "").trim(),
  overlayOpacity: Number(clampNumber(form.overlayOpacity, 0.42, 0.12, 0.88).toFixed(2)),
  textAlignment: AUTH_BRANDING_TEXT_ALIGNMENTS.includes(form.textAlignment) ? form.textAlignment : "left",
  ctaText: clampString(form.ctaText, 40),
  ctaLink: String(form.ctaLink || "").trim(),
  isActive: Boolean(form.isActive),
});

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(new Error("Could not read that image file."));
  reader.readAsDataURL(file);
});

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("Could not process that image."));
  image.src = src;
});

export const optimizeAuthBrandingImage = async (file) => {
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("Select a valid image file.");
  }

  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    const directDataUrl = await readFileAsDataUrl(file);
    if (directDataUrl.length > AUTH_BRANDING_MAX_IMAGE_CHARS) {
      throw new Error("That image is too large. Choose a smaller file.");
    }
    return directDataUrl;
  }

  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const scale = Math.min(1, 1600 / image.width, 1200 / image.height);
  const canvas = document.createElement("canvas");
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image optimization is not available in this browser.");
  }

  context.fillStyle = "#f6efe6";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  let quality = 0.88;
  let output = canvas.toDataURL("image/jpeg", quality);

  while (output.length > AUTH_BRANDING_MAX_IMAGE_CHARS && quality > 0.46) {
    quality = Number((quality - 0.08).toFixed(2));
    output = canvas.toDataURL("image/jpeg", quality);
  }

  if (output.length > AUTH_BRANDING_MAX_IMAGE_CHARS) {
    throw new Error("That image is still too large after optimization. Try a smaller file.");
  }

  return output;
};

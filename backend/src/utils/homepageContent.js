import HomepageSection from "../models/HomepageSection.js";

export const HOMEPAGE_SECTION_KEYS = [
  "categories",
  "featured-foods",
  "special-offers",
  "why-choose-us",
  "best-sellers",
  "testimonials",
  "footer",
];

export const HOMEPAGE_ITEM_SECTION_KEYS = HOMEPAGE_SECTION_KEYS.filter((key) => key !== "footer");
export const HOMEPAGE_AVAILABILITY_STATUSES = ["available", "unavailable", "out_of_stock"];

export const HOMEPAGE_DEFAULT_SECTIONS = [
  {
    key: "categories",
    title: "Popular Categories",
    subtitle: "Browse the most ordered parts of the menu at a glance.",
    isVisible: true,
    displayOrder: 0,
  },
  {
    key: "featured-foods",
    title: "Featured Foods",
    subtitle: "High-conversion dishes worth placing near the top of the homepage.",
    isVisible: true,
    displayOrder: 1,
  },
  {
    key: "special-offers",
    title: "Today's Deals",
    subtitle: "Time-bound offers that should stand out immediately.",
    isVisible: true,
    displayOrder: 2,
  },
  {
    key: "why-choose-us",
    title: "Why Choose Us",
    subtitle: "Short trust signals that explain why customers should order here.",
    isVisible: true,
    displayOrder: 3,
  },
  {
    key: "best-sellers",
    title: "Chef Recommendations",
    subtitle: "Premium best sellers and chef-picked meals with stronger emphasis.",
    isVisible: true,
    displayOrder: 4,
  },
  {
    key: "testimonials",
    title: "Customer Reviews",
    subtitle: "Short, credible feedback that reinforces trust before checkout.",
    isVisible: true,
    displayOrder: 5,
  },
  {
    key: "footer",
    title: "Contact Us",
    subtitle: "Keep contact details easy to find and consistent across the site.",
    isVisible: true,
    displayOrder: 6,
    settings: {
      restaurantName: "Flavor Point",
      address: "Mogadishu, Somalia",
      phone: "+252 61 000 000",
      email: "hello@flavorpoint.com",
      openingHours: "Open daily, 9:00 AM - 11:00 PM",
      facebookUrl: "",
      instagramUrl: "",
      tiktokUrl: "",
      footerLinks: [
        { label: "Home", href: "/" },
        { label: "Menu", href: "/menu" },
        { label: "Offers", href: "/#offers" },
        { label: "Contact", href: "/#contact" },
      ],
    },
  },
];

export const isValidHomepageActionLink = (value) => /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(String(value || "").trim());

export const normalizeFooterLinks = (links = []) => (
  Array.isArray(links)
    ? links
      .map((entry) => ({
        label: String(entry?.label || "").trim(),
        href: String(entry?.href || "").trim(),
      }))
      .filter((entry) => entry.label && entry.href)
    : []
);

export const ensureHomepageSections = async () => {
  await HomepageSection.bulkWrite(
    HOMEPAGE_DEFAULT_SECTIONS.map((section) => ({
      updateOne: {
        filter: { key: section.key },
        update: { $setOnInsert: section },
        upsert: true,
      },
    }))
  );
};

export const isHomepageItemWithinSchedule = (item, now = new Date()) => {
  const current = now instanceof Date ? now : new Date(now);
  const start = item?.startDate ? new Date(item.startDate) : null;
  const end = item?.endDate ? new Date(item.endDate) : null;

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

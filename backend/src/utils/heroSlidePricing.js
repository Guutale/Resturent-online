export const HERO_DISCOUNT_TYPES = ["none", "percentage", "fixed"];
export const HERO_AVAILABILITY_STATUSES = ["available", "unavailable", "out_of_stock"];

export const calculateHeroFinalPrice = ({ originalPrice, discountType = "none", discountValue = 0 }) => {
  const original = Number(originalPrice);
  const discount = Number(discountValue || 0);

  if (!Number.isFinite(original) || original < 0) {
    throw new Error("originalPrice must be a valid non-negative number");
  }

  if (!HERO_DISCOUNT_TYPES.includes(discountType)) {
    throw new Error("discountType must be none, percentage, or fixed");
  }

  if (!Number.isFinite(discount) || discount < 0) {
    throw new Error("discountValue must be a valid non-negative number");
  }

  if (discountType === "percentage" && discount > 100) {
    throw new Error("percentage discount cannot exceed 100");
  }

  let finalPrice = original;

  if (discountType === "percentage") {
    finalPrice = original - (original * discount) / 100;
  }

  if (discountType === "fixed") {
    finalPrice = original - discount;
  }

  return Number(Math.max(0, finalPrice).toFixed(2));
};

export const isHeroSlideWithinSchedule = (slide, now = new Date()) => {
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

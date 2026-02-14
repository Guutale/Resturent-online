import Order from "../models/Order.js";

export const generateOrderNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const latest = await Order.findOne({ orderNumber: new RegExp(`^${prefix}`) })
    .sort({ createdAt: -1 })
    .select("orderNumber")
    .lean();

  let next = 1;
  if (latest?.orderNumber) {
    const lastPart = latest.orderNumber.split("-").pop();
    const parsed = Number(lastPart);
    if (!Number.isNaN(parsed)) next = parsed + 1;
  }

  return `${prefix}${String(next).padStart(5, "0")}`;
};

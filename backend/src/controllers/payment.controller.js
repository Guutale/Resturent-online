import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../utils/audit.js";
import { createNotification } from "../utils/notify.js";

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const adminListPayments = asyncHandler(async (req, res) => {
  const { paymentStatus, paymentMethod, search, from, to } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (search) filter.orderNumber = { $regex: escapeRegex(String(search)), $options: "i" };

  if (from || to) {
    filter.createdAt = {};
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) filter.createdAt.$gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) filter.createdAt.$lte = d;
    }
    if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
  }

  const total = await Payment.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const items = await Payment.find(filter)
    .select("-proofImageUrl")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json({ items, page, pages, total });
});

export const adminGetPayment = asyncHandler(async (req, res) => {
  const item = await Payment.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ message: "Payment not found" });
  return res.json({ item });
});

export const adminUpdatePayment = asyncHandler(async (req, res) => {
  const { paymentStatus, failureReason } = req.body;
  const allowed = ["unpaid", "pending", "paid", "failed", "refunded"];
  if (!allowed.includes(paymentStatus)) {
    return res.status(400).json({ message: "Invalid paymentStatus" });
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ message: "Payment not found" });

  const prev = payment.paymentStatus;
  payment.paymentStatus = paymentStatus;
  if (paymentStatus === "paid" && !payment.paidAt) payment.paidAt = new Date();
  if (paymentStatus === "refunded" && !payment.refundedAt) payment.refundedAt = new Date();
  if (paymentStatus === "failed") {
    if (typeof failureReason === "string" && failureReason.trim()) {
      payment.failureReason = failureReason.trim().slice(0, 500);
    }
  } else {
    payment.failureReason = undefined;
  }
  await payment.save();

  const order = await Order.findById(payment.orderId);
  if (order) {
    order.paymentStatus = paymentStatus;

    // When admin approves payment, move the order into the normal fulfillment flow.
    if (paymentStatus === "paid" && (order.status === "awaiting_payment" || order.status === "pending_verification")) {
      order.status = "pending";
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.push({
        status: "pending",
        at: new Date(),
        byUserId: req.user.id,
        byRole: req.user.role,
        note: "payment_approved",
      });
    }

    // Keep early-stage orders in verification while payment is pending.
    if (paymentStatus === "pending") {
      order.status = "pending_verification";
    }

    // If payment is reset to unpaid/failed, keep it out of kitchen.
    if ((paymentStatus === "unpaid" || paymentStatus === "failed") && order.status === "pending") {
      order.status = "awaiting_payment";
    }

    await order.save().catch(() => {});
  }

  await createNotification({
    audience: "admin",
    title: "Payment updated",
    message: `${payment.orderNumber} payment marked ${paymentStatus}.`,
    type: "payment_updated",
    data: { orderId: payment.orderId, orderNumber: payment.orderNumber, paymentStatus },
  });

  await createNotification({
    audience: "user",
    userId: payment.userId,
    title: "Payment update",
    message: `Payment status for order ${payment.orderNumber}: ${paymentStatus}.`,
    type: "payment_updated",
    data: { orderId: payment.orderId, orderNumber: payment.orderNumber, paymentStatus },
  });

  await writeAuditLog({
    actor: req.user,
    action: "admin.payment_update",
    entityType: "Payment",
    entityId: payment._id,
    meta: { orderId: payment.orderId, orderNumber: payment.orderNumber, prev, next: paymentStatus },
  });

  return res.json({ item: payment });
});

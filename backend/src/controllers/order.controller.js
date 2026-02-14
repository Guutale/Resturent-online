import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateOrderNumber } from "../utils/generateOrderNumber.js";
import { writeAuditLog } from "../utils/audit.js";
import { createNotification } from "../utils/notify.js";

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ORDER_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "assigned",
  "out_for_delivery",
  "on_the_way",
  "delivered",
  "failed",
  "cancelled",
];

const KITCHEN_STATUSES = ["pending", "cooking", "ready"];

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[ch]));

const pushStatusHistory = (order, status, actor, note) => {
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status,
    at: new Date(),
    byUserId: actor?.id,
    byRole: actor?.role,
    note,
  });
};

const applyStatusSideEffects = (order, status) => {
  const now = new Date();
  const normalized = status === "on_the_way" ? "out_for_delivery" : status;

  if (normalized === "pending") {
    if (!order.kitchenStatus) order.kitchenStatus = "pending";
    if (!order.deliveryStatus) order.deliveryStatus = "unassigned";
  }

  if (normalized === "preparing") {
    order.kitchenStatus = "cooking";
  }

  if (normalized === "ready") {
    order.kitchenStatus = "ready";
    if (!order.preparedAt) order.preparedAt = now;
  }

  if (normalized === "assigned") {
    order.deliveryStatus = "assigned";
    if (!order.deliveryAssignedAt) order.deliveryAssignedAt = now;
  }

  if (normalized === "out_for_delivery") {
    order.deliveryStatus = "out_for_delivery";
    if (!order.outForDeliveryAt) order.outForDeliveryAt = now;
  }

  if (normalized === "delivered") {
    order.deliveryStatus = "delivered";
    if (!order.deliveredAt) order.deliveredAt = now;
  }

  if (normalized === "failed") {
    order.deliveryStatus = "failed";
    if (!order.failedAt) order.failedAt = now;
  }

  if (normalized === "cancelled") {
    if (!order.cancelledAt) order.cancelledAt = now;
  }
};

export const createOrder = asyncHandler(async (req, res) => {
  const { items = [], deliveryAddress, phone, paymentMethod = "COD", customerName, deliveryLocation } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items are required" });
  }

  if (!deliveryAddress?.city || !deliveryAddress?.district || !deliveryAddress?.street) {
    return res.status(400).json({ message: "deliveryAddress city/district/street are required" });
  }

  if (!phone) {
    return res.status(400).json({ message: "phone is required" });
  }

  const allowedMethods = ["COD", "CARD", "EVCPLUS"];
  if (!allowedMethods.includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid paymentMethod" });
  }

  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isAvailable: true }).lean();
  const map = new Map(products.map((p) => [String(p._id), p]));

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = map.get(String(item.productId));
    const qty = Number(item.qty);

    if (!product) {
      return res.status(400).json({ message: `Invalid or unavailable product: ${item.productId}` });
    }

    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: `Invalid qty for product: ${item.productId}` });
    }

    if (typeof product.stockQty === "number" && product.stockQty < qty) {
      return res.status(400).json({ message: `Out of stock: ${product.title}` });
    }

    subtotal += product.price * qty;
    orderItems.push({
      productId: product._id,
      title: product.title,
      price: product.price,
      qty,
      imageUrl: product.imageUrl,
    });
  }

  const decremented = [];
  let order;

  try {
    // Reserve stock for products that track inventory. (No-op for products without stockQty)
    for (const oi of orderItems) {
      const product = map.get(String(oi.productId));
      if (typeof product?.stockQty !== "number") continue;

      const updated = await Product.findOneAndUpdate(
        { _id: oi.productId, isAvailable: true, stockQty: { $gte: oi.qty } },
        { $inc: { stockQty: -oi.qty } },
        { new: true }
      ).lean();

      if (!updated) {
        const err = new Error(`Out of stock: ${oi.title}`);
        err.statusCode = 400;
        throw err;
      }

      decremented.push({ productId: oi.productId, qty: oi.qty });

      if (typeof updated.stockQty === "number" && updated.stockQty === 0 && updated.isAvailable) {
        await Product.updateOne({ _id: updated._id }, { $set: { isAvailable: false } });
      }

      if (
        typeof updated.stockQty === "number"
        && typeof updated.lowStockThreshold === "number"
        && updated.stockQty <= updated.lowStockThreshold
      ) {
        await createNotification({
          audience: "admin",
          title: "Low stock alert",
          message: `${updated.title} is low (${updated.stockQty} left).`,
          type: "low_stock",
          data: { productId: updated._id, title: updated.title, stockQty: updated.stockQty },
        });
      }
    }

    const deliveryFee = Number(process.env.DEFAULT_DELIVERY_FEE || 2);
    const total = subtotal + deliveryFee;
    const orderNumber = await generateOrderNumber();

    const userDoc = await User.findById(req.user.id).select("name").lean();
    const displayName = String(customerName || userDoc?.name || "Customer").trim() || "Customer";

    const initialStatus = "pending";

    const safeDeliveryLocation = {};
    if (deliveryLocation && typeof deliveryLocation === "object") {
      if (deliveryLocation.lat !== undefined) safeDeliveryLocation.lat = Number(deliveryLocation.lat);
      if (deliveryLocation.lng !== undefined) safeDeliveryLocation.lng = Number(deliveryLocation.lng);
      if (typeof deliveryLocation.mapsLink === "string") safeDeliveryLocation.mapsLink = deliveryLocation.mapsLink.trim();

      if (Number.isNaN(safeDeliveryLocation.lat)) delete safeDeliveryLocation.lat;
      if (Number.isNaN(safeDeliveryLocation.lng)) delete safeDeliveryLocation.lng;

      if (safeDeliveryLocation.lat !== undefined && safeDeliveryLocation.lng !== undefined && !safeDeliveryLocation.mapsLink) {
        safeDeliveryLocation.mapsLink = `https://www.google.com/maps?q=${safeDeliveryLocation.lat},${safeDeliveryLocation.lng}`;
      }
    }

    order = await Order.create({
      orderNumber,
      userId: req.user.id,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      customer: { name: displayName, phone },
      deliveryAddress,
      deliveryLocation: Object.keys(safeDeliveryLocation).length ? safeDeliveryLocation : undefined,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "unpaid" : "paid",
      kitchenStatus: "pending",
      deliveryStatus: "unassigned",
      status: initialStatus,
      statusHistory: [
        {
          status: initialStatus,
          at: new Date(),
          byUserId: req.user.id,
          byRole: req.user.role,
        },
      ],
    });

    await Payment.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      amount: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paidAt: order.paymentStatus === "paid" ? new Date() : undefined,
    });

    await createNotification({
      audience: "admin",
      title: "New order",
      message: `${order.orderNumber} placed ($${Number(order.total || 0).toFixed(2)}).`,
      type: "order_created",
      data: { orderId: order._id, orderNumber: order.orderNumber },
    });

    await createNotification({
      audience: "user",
      userId: req.user.id,
      title: "Order confirmed",
      message: `Your order ${order.orderNumber} has been placed successfully.`,
      type: "order_confirmed",
      data: { orderId: order._id, orderNumber: order.orderNumber },
    });

    return res.status(201).json({ orderId: order._id, orderNumber: order.orderNumber, status: order.status });
  } catch (err) {
    if (order?._id) {
      await Order.findByIdAndDelete(order._id).catch(() => {});
      await Payment.deleteOne({ orderId: order._id }).catch(() => {});
    }
    for (const d of decremented) {
      await Product.updateOne({ _id: d.productId }, { $inc: { stockQty: d.qty } }).catch(() => {});
    }
    throw err;
  }
});

export const myOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { userId: req.user.id };
  if (status) filter.status = status;

  const total = await Order.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const items = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json({ items, page, pages, total });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean();

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const isOwner = String(order.userId) === req.user.id;
  const isAdmin = req.user.role === "admin";
  const isDispatcher = req.user.role === "dispatcher";
  const isChef = req.user.role === "chef" && ["pending", "preparing", "ready"].includes(order.status);
  const isAssignedDelivery =
    req.user.role === "delivery" && String(order.assignedDeliveryUserId || "") === req.user.id;

  if (!isOwner && !isAdmin && !isDispatcher && !isChef && !isAssignedDelivery) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({ order });
});

export const getOrderInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean();

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const isOwner = String(order.userId) === req.user.id;
  const isAdmin = req.user.role === "admin";
  const isDispatcher = req.user.role === "dispatcher";
  const isChef = req.user.role === "chef" && ["pending", "preparing", "ready"].includes(order.status);
  const isAssignedDelivery =
    req.user.role === "delivery" && String(order.assignedDeliveryUserId || "") === req.user.id;

  if (!isOwner && !isAdmin && !isDispatcher && !isChef && !isAssignedDelivery) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const rows = (order.items || [])
    .map((i) => {
      const title = escapeHtml(i.title);
      const qty = Number(i.qty || 0);
      const price = Number(i.price || 0);
      const line = (qty * price).toFixed(2);
      return `<tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${title}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">${qty}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">$${price.toFixed(2)}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:800;">$${line}</td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice ${escapeHtml(order.orderNumber)}</title>
  </head>
  <body style="margin:0;background:#f9fafb;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;color:#111827;">
    <div style="max-width:900px;margin:0 auto;padding:24px;">
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:20px;">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start;">
          <div>
            <div style="font-weight:950;font-size:22px;">FlavorPoint</div>
            <div style="color:#6b7280;font-weight:600;margin-top:4px;">Invoice</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:950;">${escapeHtml(order.orderNumber)}</div>
            <div style="color:#6b7280;font-weight:600;margin-top:4px;">${escapeHtml(new Date(order.createdAt).toLocaleString())}</div>
          </div>
        </div>

        <div style="height:1px;background:#eef2f7;margin:18px 0;"></div>

        <div style="display:grid;grid-template-columns:1fr;gap:14px;">
          <div>
            <div style="color:#6b7280;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Customer</div>
            <div style="font-weight:900;margin-top:6px;">${escapeHtml(order.customer?.name || "Customer")}</div>
            <div style="color:#374151;margin-top:2px;">${escapeHtml(order.customer?.phone || "-")}</div>
          </div>
          <div>
            <div style="color:#6b7280;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Delivery Address</div>
            <div style="margin-top:6px;color:#111827;font-weight:800;">${escapeHtml(order.deliveryAddress?.city || "")}, ${escapeHtml(order.deliveryAddress?.district || "")}</div>
            <div style="color:#374151;margin-top:2px;">${escapeHtml(order.deliveryAddress?.street || "")}</div>
            ${order.deliveryAddress?.notes ? `<div style="color:#6b7280;margin-top:6px;">${escapeHtml(order.deliveryAddress.notes)}</div>` : ""}
          </div>
        </div>

        <div style="height:1px;background:#eef2f7;margin:18px 0;"></div>

        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Item</th>
              <th style="text-align:right;padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Qty</th>
              <th style="text-align:right;padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Price</th>
              <th style="text-align:right;padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="display:flex;justify-content:flex-end;margin-top:14px;">
          <div style="min-width:260px;">
            <div style="display:flex;justify-content:space-between;color:#6b7280;font-weight:700;padding:6px 0;">
              <span>Subtotal</span><span>$${Number(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;color:#6b7280;font-weight:700;padding:6px 0;">
              <span>Delivery</span><span>$${Number(order.deliveryFee || 0).toFixed(2)}</span>
            </div>
            <div style="height:1px;background:#eef2f7;margin:8px 0;"></div>
            <div style="display:flex;justify-content:space-between;font-weight:950;font-size:16px;padding:6px 0;">
              <span>Total</span><span>$${Number(order.total || 0).toFixed(2)}</span>
            </div>
            <div style="color:#6b7280;font-weight:700;margin-top:8px;">
              Payment: ${escapeHtml(order.paymentMethod)} (${escapeHtml(order.paymentStatus)})
            </div>
          </div>
        </div>

        <div style="height:1px;background:#eef2f7;margin:18px 0;"></div>
        <div style="color:#6b7280;font-weight:600;font-size:12px;">
          Tip: Use your browser print dialog to save this invoice as PDF.
        </div>
      </div>
    </div>
  </body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `inline; filename="invoice-${order.orderNumber}.html"`);
  return res.status(200).send(html);
});

export const adminListOrders = asyncHandler(async (req, res) => {
  const { status, search, userId, assignedDeliveryUserId, paymentStatus, paymentMethod, from, to } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (status && ORDER_STATUSES.includes(status)) filter.status = status;
  if (userId) filter.userId = userId;
  if (assignedDeliveryUserId) filter.assignedDeliveryUserId = assignedDeliveryUserId;
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

  const total = await Order.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const items = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json({ items, page, pages, total });
});

export const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const prev = order.status;
  order.status = status;
  pushStatusHistory(order, status, req.user, "admin_update");
  applyStatusSideEffects(order, status);
  await order.save();

  if (String(order.userId)) {
    await createNotification({
      audience: "user",
      userId: order.userId,
      title: "Order update",
      message: `Your order ${order.orderNumber} is now ${status.replaceAll("_", " ")}.`,
      type: "order_status_updated",
      data: { orderId: order._id, orderNumber: order.orderNumber, status },
    });
  }

  await writeAuditLog({
    actor: req.user,
    action: "admin.order_status_update",
    entityType: "Order",
    entityId: order._id,
    meta: { orderNumber: order.orderNumber, prev, next: status },
  });

  return res.json({ order });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (String(order.userId) !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (order.status !== "pending") {
    return res.status(400).json({ message: "Only pending orders can be cancelled" });
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  pushStatusHistory(order, "cancelled", req.user, "user_cancel");
  await order.save();

  await createNotification({
    audience: "admin",
    title: "Order cancelled",
    message: `${order.orderNumber} was cancelled by the customer.`,
    type: "order_cancelled",
    data: { orderId: order._id, orderNumber: order.orderNumber },
  });

  await createNotification({
    audience: "user",
    userId: order.userId,
    title: "Order cancelled",
    message: `Your order ${order.orderNumber} has been cancelled.`,
    type: "order_cancelled",
    data: { orderId: order._id, orderNumber: order.orderNumber },
  });

  await writeAuditLog({
    actor: req.user,
    action: "user.order_cancel",
    entityType: "Order",
    entityId: order._id,
    meta: { orderNumber: order.orderNumber },
  });

  return res.json({ order });
});

export const adminAssignDelivery = asyncHandler(async (req, res) => {
  const { deliveryUserId } = req.body;
  if (!deliveryUserId) {
    return res.status(400).json({ message: "deliveryUserId is required" });
  }

  const deliveryUser = await User.findById(deliveryUserId).select("_id role name").lean();
  if (!deliveryUser || deliveryUser.role !== "delivery") {
    return res.status(400).json({ message: "Invalid delivery user" });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.status === "delivered" || order.status === "cancelled" || order.status === "failed") {
    return res.status(400).json({ message: "Cannot assign delivery for a completed order" });
  }

  if (order.assignedDeliveryUserId) {
    return res.status(400).json({ message: "Order already has an assigned delivery user" });
  }

  const prev = { status: order.status, assignedDeliveryUserId: order.assignedDeliveryUserId };

  order.assignedDeliveryUserId = deliveryUser._id;
  order.deliveryAssignedByUserId = req.user.id;
  order.deliveryAssignedAt = new Date();
  order.status = "assigned";
  order.deliveryStatus = "assigned";
  pushStatusHistory(order, "assigned", req.user, `assigned_to:${deliveryUser._id}`);

  await order.save();

  await createNotification({
    audience: "user",
    userId: deliveryUser._id,
    title: "New delivery assigned",
    message: `Order ${order.orderNumber} has been assigned to you.`,
    type: "delivery_assigned",
    data: { orderId: order._id, orderNumber: order.orderNumber },
  });

  await createNotification({
    audience: "user",
    userId: order.userId,
    title: "Delivery assigned",
    message: `A delivery driver has been assigned to your order ${order.orderNumber}.`,
    type: "delivery_assigned",
    data: { orderId: order._id, orderNumber: order.orderNumber },
  });

  await writeAuditLog({
    actor: req.user,
    action: "admin.order_assign_delivery",
    entityType: "Order",
    entityId: order._id,
    meta: { orderNumber: order.orderNumber, prev, next: { status: order.status, assignedDeliveryUserId: order.assignedDeliveryUserId } },
  });

  return res.json({ order });
});

export const deliveryAssignedOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { assignedDeliveryUserId: req.user.id };
  if (status && ORDER_STATUSES.includes(status)) {
    filter.status = status;
  } else {
    filter.status = { $in: ["assigned", "out_for_delivery", "on_the_way"] };
  }

  const total = await Order.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const items = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json({ items, page, pages, total });
});

export const deliveryUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ["out_for_delivery", "delivered", "failed", "on_the_way"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const isDelivery = req.user.role === "delivery";
  const isDispatcher = req.user.role === "dispatcher";

  if (isDelivery && String(order.assignedDeliveryUserId || "") !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const prev = order.status;

  const normalized = status === "on_the_way" ? "out_for_delivery" : status;

  if (normalized === "out_for_delivery" && prev !== "assigned") {
    return res.status(400).json({ message: "Order must be assigned before it can go out for delivery" });
  }

  if ((normalized === "delivered" || normalized === "failed") && prev !== "out_for_delivery" && prev !== "on_the_way") {
    return res.status(400).json({ message: "Order must be out for delivery before it can be delivered" });
  }

  order.status = normalized;
  pushStatusHistory(order, normalized, req.user, isDispatcher ? "dispatcher_delivery_update" : "delivery_update");
  applyStatusSideEffects(order, normalized);

  await order.save();

  await createNotification({
    audience: "user",
    userId: order.userId,
    title: "Order update",
    message: `Your order ${order.orderNumber} is now ${status.replaceAll("_", " ")}.`,
    type: "order_status_updated",
    data: { orderId: order._id, orderNumber: order.orderNumber, status },
  });

  await writeAuditLog({
    actor: req.user,
    action: isDispatcher ? "dispatcher.order_status_update" : "delivery.order_status_update",
    entityType: "Order",
    entityId: order._id,
    meta: { orderNumber: order.orderNumber, prev, next: normalized },
  });

  return res.json({ order });
});

export const kitchenOrders = asyncHandler(async (req, res) => {
  const { kitchenStatus, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { status: { $in: ["pending", "preparing", "ready"] } };
  if (kitchenStatus && KITCHEN_STATUSES.includes(kitchenStatus)) {
    filter.kitchenStatus = kitchenStatus;
  }
  if (search) filter.orderNumber = { $regex: escapeRegex(String(search)), $options: "i" };

  const total = await Order.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const items = await Order.find(filter)
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json({ items, page, pages, total });
});

export const updateKitchenStatus = asyncHandler(async (req, res) => {
  const { kitchenStatus } = req.body;

  if (!KITCHEN_STATUSES.includes(kitchenStatus)) {
    return res.status(400).json({ message: "Invalid kitchenStatus" });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.status === "delivered" || order.status === "cancelled" || order.status === "failed") {
    return res.status(400).json({ message: "Cannot update kitchen status for a completed order" });
  }

  const current = order.kitchenStatus || (order.status === "preparing" ? "cooking" : order.status === "ready" ? "ready" : "pending");
  const next = kitchenStatus;

  const allowedTransitions = {
    pending: ["cooking"],
    cooking: ["ready"],
    ready: [],
  };

  if (current !== next && !allowedTransitions[current]?.includes(next)) {
    return res.status(400).json({ message: `Invalid kitchen status transition: ${current} -> ${next}` });
  }

  const prev = { kitchenStatus: current, status: order.status };

  order.kitchenStatus = next;

  if (next === "cooking" && order.status === "pending") {
    order.status = "preparing";
    pushStatusHistory(order, "preparing", req.user, "kitchen_start");
  }

  if (next === "ready") {
    order.status = "ready";
    pushStatusHistory(order, "ready", req.user, "kitchen_ready");
    if (!order.preparedAt) order.preparedAt = new Date();
  }

  await order.save();

  if (String(order.userId)) {
    await createNotification({
      audience: "user",
      userId: order.userId,
      title: "Order update",
      message: `Your order ${order.orderNumber} is now ${order.status.replaceAll("_", " ")}.`,
      type: "order_status_updated",
      data: { orderId: order._id, orderNumber: order.orderNumber, status: order.status },
    });
  }

  await writeAuditLog({
    actor: req.user,
    action: "chef.kitchen_status_update",
    entityType: "Order",
    entityId: order._id,
    meta: { orderNumber: order.orderNumber, prev, next: { kitchenStatus: order.kitchenStatus, status: order.status } },
  });

  return res.json({ order });
});

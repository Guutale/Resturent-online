import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../utils/audit.js";

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 200);
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizePhone = (value) => (value === undefined || value === null ? "" : String(value).trim());
const isTimeHHmm = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value));

const allowedAvailability = ["available", "busy", "offline"];

export const listDeliveryStaff = asyncHandler(async (req, res) => {
  const { search, availabilityStatus, isBlocked } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { role: "delivery" };

  if (availabilityStatus && allowedAvailability.includes(availabilityStatus)) {
    filter["staff.availabilityStatus"] = availabilityStatus;
  }

  if (isBlocked === "true") filter.isBlocked = true;
  if (isBlocked === "false") filter.isBlocked = false;

  if (search) {
    const rx = new RegExp(escapeRegex(String(search).trim()), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const total = await User.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const items = await User.find(filter)
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json({ items, page, pages, total });
});

export const createDeliveryStaff = asyncHandler(async (req, res) => {
  const { name, email, password, phone, staff } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (!name || !normalizedEmail || !password || !normalizedPhone) {
    return res.status(400).json({ message: "name, email, password and phone are required" });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: "password must be at least 6 characters" });
  }

  const existsEmail = await User.findOne({ email: normalizedEmail }).lean();
  if (existsEmail) return res.status(400).json({ message: "Email already in use" });

  const existsPhone = await User.findOne({ phone: normalizedPhone }).lean();
  if (existsPhone) return res.status(400).json({ message: "Phone already in use" });

  const passwordHash = await bcrypt.hash(String(password), 10);

  const doc = {
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: "delivery",
    phone: normalizedPhone,
    staff: {},
  };

  if (staff && typeof staff === "object") {
    if (typeof staff.vehicleType === "string") doc.staff.vehicleType = staff.vehicleType.trim();
    if (staff.availabilityStatus && allowedAvailability.includes(staff.availabilityStatus)) {
      doc.staff.availabilityStatus = staff.availabilityStatus;
    }
    if (staff.monthlySalary !== undefined) {
      const v = Number(staff.monthlySalary);
      if (!Number.isFinite(v) || v < 0) return res.status(400).json({ message: "monthlySalary must be a non-negative number" });
      doc.staff.monthlySalary = v;
    }
    if (staff.salaryPayDay !== undefined) {
      const v = Number(staff.salaryPayDay);
      if (!Number.isInteger(v) || v < 1 || v > 31) return res.status(400).json({ message: "salaryPayDay must be an integer 1-31" });
      doc.staff.salaryPayDay = v;
    }
    if (staff.startDate !== undefined) {
      const d = new Date(staff.startDate);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "startDate must be a valid date" });
      doc.staff.startDate = d;
    }
    if (staff.timeIn !== undefined) {
      const v = String(staff.timeIn || "").trim();
      if (v) {
        if (!isTimeHHmm(v)) return res.status(400).json({ message: "timeIn must be in HH:mm format" });
        doc.staff.timeIn = v;
      }
    }
    if (staff.timeOut !== undefined) {
      const v = String(staff.timeOut || "").trim();
      if (v) {
        if (!isTimeHHmm(v)) return res.status(400).json({ message: "timeOut must be in HH:mm format" });
        doc.staff.timeOut = v;
      }
    }
  }

  const user = await User.create(doc);

  await writeAuditLog({
    actor: req.user,
    action: "staff.delivery_create",
    entityType: "User",
    entityId: user._id,
    meta: { role: user.role, email: user.email },
  });

  const safe = await User.findById(user._id).select("-passwordHash").lean();
  return res.status(201).json({ user: safe || user });
});

export const updateDeliveryStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, isBlocked, staff } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role !== "delivery") return res.status(400).json({ message: "Target user is not delivery role" });

  const prev = { name: user.name, email: user.email, phone: user.phone, isBlocked: user.isBlocked, staff: user.staff };

  if (typeof name === "string" && name.trim()) user.name = name.trim();

  if (email !== undefined) {
    const nextEmail = normalizeEmail(email);
    if (!nextEmail) return res.status(400).json({ message: "email is required" });
    const existingEmail = await User.findOne({ email: nextEmail, _id: { $ne: user._id } }).lean();
    if (existingEmail) return res.status(400).json({ message: "Email already in use" });
    user.email = nextEmail;
  }

  if (phone !== undefined) {
    const nextPhone = normalizePhone(phone);
    if (!nextPhone) return res.status(400).json({ message: "phone is required" });
    const existingPhone = await User.findOne({ phone: nextPhone, _id: { $ne: user._id } }).lean();
    if (existingPhone) return res.status(400).json({ message: "Phone already in use" });
    user.phone = nextPhone;
  }

  if (typeof isBlocked === "boolean") user.isBlocked = isBlocked;

  if (staff && typeof staff === "object") {
    if (!user.staff) user.staff = {};
    if (typeof staff.vehicleType === "string") user.staff.vehicleType = staff.vehicleType.trim();
    if (staff.availabilityStatus !== undefined) {
      if (!allowedAvailability.includes(staff.availabilityStatus)) {
        return res.status(400).json({ message: "availabilityStatus must be available, busy, or offline" });
      }
      user.staff.availabilityStatus = staff.availabilityStatus;
    }
    if (staff.monthlySalary !== undefined) {
      const v = Number(staff.monthlySalary);
      if (!Number.isFinite(v) || v < 0) return res.status(400).json({ message: "monthlySalary must be a non-negative number" });
      user.staff.monthlySalary = v;
    }
    if (staff.salaryPayDay !== undefined) {
      const v = Number(staff.salaryPayDay);
      if (!Number.isInteger(v) || v < 1 || v > 31) return res.status(400).json({ message: "salaryPayDay must be an integer 1-31" });
      user.staff.salaryPayDay = v;
    }
    if (staff.startDate !== undefined) {
      const d = new Date(staff.startDate);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "startDate must be a valid date" });
      user.staff.startDate = d;
    }
    if (staff.timeIn !== undefined) {
      const v = String(staff.timeIn || "").trim();
      if (!v) user.staff.timeIn = undefined;
      else {
        if (!isTimeHHmm(v)) return res.status(400).json({ message: "timeIn must be in HH:mm format" });
        user.staff.timeIn = v;
      }
    }
    if (staff.timeOut !== undefined) {
      const v = String(staff.timeOut || "").trim();
      if (!v) user.staff.timeOut = undefined;
      else {
        if (!isTimeHHmm(v)) return res.status(400).json({ message: "timeOut must be in HH:mm format" });
        user.staff.timeOut = v;
      }
    }
  }

  await user.save();

  await writeAuditLog({
    actor: req.user,
    action: "staff.delivery_update",
    entityType: "User",
    entityId: user._id,
    meta: { prev, next: { name: user.name, email: user.email, phone: user.phone, isBlocked: user.isBlocked, staff: user.staff } },
  });

  const safe = await User.findById(user._id).select("-passwordHash").lean();
  return res.json({ user: safe || user });
});

export const deliveryStaffPerformance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select("_id role name").lean();
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role !== "delivery") return res.status(400).json({ message: "Target user is not delivery role" });

  const deliveryUserId = new mongoose.Types.ObjectId(String(id));

  const counts = await Order.aggregate([
    { $match: { assignedDeliveryUserId: deliveryUserId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const deliveredAgg = await Order.aggregate([
    { $match: { assignedDeliveryUserId: deliveryUserId, status: "delivered", deliveredAt: { $type: "date" } } },
    {
      $project: {
        durationMs: {
          $subtract: [
            "$deliveredAt",
            { $ifNull: ["$outForDeliveryAt", { $ifNull: ["$deliveryAssignedAt", "$createdAt"] }] },
          ],
        },
      },
    },
    { $group: { _id: null, avgDurationMs: { $avg: "$durationMs" }, count: { $sum: 1 } } },
  ]);

  const map = Object.fromEntries(counts.map((c) => [String(c._id), Number(c.count || 0)]));
  const deliveredCount = map.delivered || 0;
  const cancelledCount = (map.cancelled || 0) + (map.failed || 0);

  const avgDurationMs = deliveredAgg?.[0]?.avgDurationMs || 0;
  const avgDeliveryMinutes = avgDurationMs ? Math.round(avgDurationMs / 60000) : 0;

  return res.json({
    performance: {
      completedDeliveries: deliveredCount,
      cancelledDeliveries: cancelledCount,
      avgDeliveryMinutes,
    },
  });
});

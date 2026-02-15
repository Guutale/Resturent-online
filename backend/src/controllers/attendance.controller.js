import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../utils/audit.js";

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 200);
  return { page, limit, skip: (page - 1) * limit };
};

const normalizeDateToMidnight = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const isStaffRole = (role) => role === "chef" || role === "waiter" || role === "delivery" || role === "dispatcher" || role === "hr" || role === "finance";

export const listAttendance = asyncHandler(async (req, res) => {
  const { staffUserId, from, to } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  if (!staffUserId) {
    return res.status(400).json({ message: "staffUserId is required" });
  }

  const filter = { staffUserId };

  if (from || to) {
    filter.date = {};
    if (from) {
      const d = normalizeDateToMidnight(from);
      if (d) filter.date.$gte = d;
    }
    if (to) {
      const d = normalizeDateToMidnight(to);
      if (d) filter.date.$lte = d;
    }
    if (Object.keys(filter.date).length === 0) delete filter.date;
  }

  const total = await Attendance.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const items = await Attendance.find(filter)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate("staffUserId", "name email phone role isBlocked staff")
    .lean();

  return res.json({ items, page, pages, total });
});

export const upsertAttendance = asyncHandler(async (req, res) => {
  const { staffUserId, date, checkInTime, checkOutTime, notes } = req.body;

  if (!staffUserId) {
    return res.status(400).json({ message: "staffUserId is required" });
  }

  const staffUser = await User.findById(staffUserId).select("_id role").lean();
  if (!staffUser || !isStaffRole(staffUser.role)) {
    return res.status(400).json({ message: "Invalid staffUserId" });
  }

  const day = normalizeDateToMidnight(date || new Date());
  if (!day) return res.status(400).json({ message: "date must be a valid date" });

  const patch = {};
  if (checkInTime !== undefined) {
    const d = checkInTime ? new Date(checkInTime) : null;
    if (d && Number.isNaN(d.getTime())) return res.status(400).json({ message: "checkInTime must be a valid date" });
    patch.checkInTime = d || undefined;
  }
  if (checkOutTime !== undefined) {
    const d = checkOutTime ? new Date(checkOutTime) : null;
    if (d && Number.isNaN(d.getTime())) return res.status(400).json({ message: "checkOutTime must be a valid date" });
    patch.checkOutTime = d || undefined;
  }
  if (notes !== undefined) {
    patch.notes = typeof notes === "string" ? notes.trim() : "";
  }

  const existing = await Attendance.findOne({ staffUserId, date: day });
  const prev = existing ? { checkInTime: existing.checkInTime, checkOutTime: existing.checkOutTime, notes: existing.notes } : null;

  const item = await Attendance.findOneAndUpdate(
    { staffUserId, date: day },
    {
      $set: {
        staffUserId,
        date: day,
        ...patch,
      },
      $setOnInsert: { createdByUserId: req.user.id },
    },
    { upsert: true, new: true }
  ).populate("staffUserId", "name email phone role isBlocked staff");

  await writeAuditLog({
    actor: req.user,
    action: req.user.role === "hr" ? "hr.attendance_upsert" : "admin.attendance_upsert",
    entityType: "Attendance",
    entityId: item._id,
    meta: { staffUserId, date: day, prev, next: { checkInTime: item.checkInTime, checkOutTime: item.checkOutTime, notes: item.notes } },
  });

  return res.status(existing ? 200 : 201).json({ item });
});


import bcrypt from "bcryptjs";
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

const STAFF_ROLES = ["chef", "waiter", "delivery", "dispatcher", "hr", "finance"];
const HR_MANAGED_ROLES = ["chef", "waiter", "delivery"];
const employmentStatuses = ["active", "on_leave", "suspended", "terminated"];
const availabilityStatuses = ["available", "busy", "offline"];

const canActorManageRole = (actorRole, targetRole) => {
  if (actorRole === "admin") return STAFF_ROLES.includes(targetRole);
  if (actorRole === "hr") return HR_MANAGED_ROLES.includes(targetRole);
  return false;
};

const toEmploymentIsBlocked = (employmentStatus) => employmentStatus !== "active";

export const listStaff = asyncHandler(async (req, res) => {
  const { role, search, employmentStatus, isBlocked } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const actorRole = req.user.role;

  const filter = { role: { $in: actorRole === "hr" ? HR_MANAGED_ROLES : STAFF_ROLES } };

  if (role && STAFF_ROLES.includes(role)) {
    if (actorRole === "hr" && !HR_MANAGED_ROLES.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    filter.role = role;
  }

  if (employmentStatus && employmentStatuses.includes(employmentStatus)) {
    filter["staff.employmentStatus"] = employmentStatus;
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

export const getStaffById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash").lean();
  if (!user) return res.status(404).json({ message: "Staff not found" });

  if (!canActorManageRole(req.user.role, user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({ user });
});

export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, staff } = req.body;

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  const nextRole = String(role || "").trim();
  const actorRole = req.user.role;

  if (!canActorManageRole(actorRole, nextRole)) {
    return res.status(400).json({ message: "Invalid staff role" });
  }

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

  const staffDoc = {};
  if (staff && typeof staff === "object") {
    if (typeof staff.nationalId === "string") staffDoc.nationalId = staff.nationalId.trim();
    if (typeof staff.address === "string") staffDoc.address = staff.address.trim();
    if (typeof staff.experience === "string") staffDoc.experience = staff.experience.trim();

    if (staff.monthlySalary !== undefined) {
      const v = Number(staff.monthlySalary);
      if (!Number.isFinite(v) || v < 0) return res.status(400).json({ message: "monthlySalary must be a non-negative number" });
      staffDoc.monthlySalary = v;
    }

    if (staff.salaryPayDay !== undefined) {
      const v = Number(staff.salaryPayDay);
      if (!Number.isInteger(v) || v < 1 || v > 31) return res.status(400).json({ message: "salaryPayDay must be an integer from 1 to 31" });
      staffDoc.salaryPayDay = v;
    }

    if (staff.startDate !== undefined) {
      const d = new Date(staff.startDate);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "startDate must be a valid date" });
      staffDoc.startDate = d;
    }

    if (staff.timeIn !== undefined) {
      const v = String(staff.timeIn || "").trim();
      if (v) {
        if (!isTimeHHmm(v)) return res.status(400).json({ message: "timeIn must be in HH:mm format" });
        staffDoc.timeIn = v;
      }
    }

    if (staff.timeOut !== undefined) {
      const v = String(staff.timeOut || "").trim();
      if (v) {
        if (!isTimeHHmm(v)) return res.status(400).json({ message: "timeOut must be in HH:mm format" });
        staffDoc.timeOut = v;
      }
    }

    if (typeof staff.employmentStatus === "string" && employmentStatuses.includes(staff.employmentStatus)) {
      staffDoc.employmentStatus = staff.employmentStatus;
    }

    if (typeof staff.terminationReason === "string") staffDoc.terminationReason = staff.terminationReason.trim();
    if (staff.terminationDate !== undefined) {
      const d = new Date(staff.terminationDate);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "terminationDate must be a valid date" });
      staffDoc.terminationDate = d;
    }

    if (typeof staff.vehicleType === "string") staffDoc.vehicleType = staff.vehicleType.trim();
    if (typeof staff.availabilityStatus === "string" && availabilityStatuses.includes(staff.availabilityStatus)) {
      staffDoc.availabilityStatus = staff.availabilityStatus;
    }
  }

  if (nextRole === "chef" || nextRole === "waiter") {
    const addr = String(staffDoc.address || "").trim();
    const exp = String(staffDoc.experience || "").trim();
    const monthlySalary = staffDoc.monthlySalary;
    const salaryPayDay = staffDoc.salaryPayDay;
    const startDate = staffDoc.startDate;

    if (!addr || !exp || typeof monthlySalary !== "number") {
      return res.status(400).json({ message: "address, experience and monthlySalary are required for chef/waiter" });
    }

    if (!Number.isInteger(Number(salaryPayDay)) || salaryPayDay < 1 || salaryPayDay > 31) {
      return res.status(400).json({ message: "salaryPayDay (1-31) is required for chef/waiter" });
    }

    if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "startDate is required for chef/waiter" });
    }
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  const employmentStatus = staffDoc.employmentStatus || "active";
  const isBlocked = toEmploymentIsBlocked(employmentStatus);

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: nextRole,
    phone: normalizedPhone,
    staff: { ...staffDoc, employmentStatus },
    isBlocked,
  });

  await writeAuditLog({
    actor: req.user,
    action: actorRole === "hr" ? "hr.staff_create" : "admin.staff_create",
    entityType: "User",
    entityId: user._id,
    meta: { role: user.role, email: user.email },
  });

  const safe = await User.findById(user._id).select("-passwordHash").lean();
  return res.status(201).json({ user: safe || user });
});

export const updateStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, staff, isBlocked } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Staff not found" });

  const actorRole = req.user.role;

  if (!canActorManageRole(actorRole, user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (String(user._id) === req.user.id) {
    return res.status(400).json({ message: "You cannot update your own account here" });
  }

  const prev = {
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isBlocked: user.isBlocked,
    staff: user.staff,
  };

  if (role !== undefined) {
    const nextRole = String(role || "").trim();
    if (!canActorManageRole(actorRole, nextRole)) {
      return res.status(400).json({ message: "Invalid staff role" });
    }
    user.role = nextRole;
  }

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
    if (typeof staff.nationalId === "string") user.staff.nationalId = staff.nationalId.trim();
    if (typeof staff.address === "string") user.staff.address = staff.address.trim();
    if (typeof staff.experience === "string") user.staff.experience = staff.experience.trim();

    if (staff.monthlySalary !== undefined) {
      const v = Number(staff.monthlySalary);
      if (!Number.isFinite(v) || v < 0) return res.status(400).json({ message: "monthlySalary must be a non-negative number" });
      user.staff.monthlySalary = v;
    }

    if (staff.salaryPayDay !== undefined) {
      const v = Number(staff.salaryPayDay);
      if (!Number.isInteger(v) || v < 1 || v > 31) return res.status(400).json({ message: "salaryPayDay must be an integer from 1 to 31" });
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

    if (staff.employmentStatus !== undefined) {
      if (!employmentStatuses.includes(staff.employmentStatus)) {
        return res.status(400).json({ message: "Invalid employmentStatus" });
      }
      user.staff.employmentStatus = staff.employmentStatus;
      user.isBlocked = toEmploymentIsBlocked(staff.employmentStatus);
      if (staff.employmentStatus === "terminated") {
        if (typeof staff.terminationReason === "string") user.staff.terminationReason = staff.terminationReason.trim();
        user.staff.terminationDate = staff.terminationDate ? new Date(staff.terminationDate) : new Date();
      }
    }

    if (typeof staff.terminationReason === "string") user.staff.terminationReason = staff.terminationReason.trim();
    if (staff.terminationDate !== undefined) {
      const d = new Date(staff.terminationDate);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "terminationDate must be a valid date" });
      user.staff.terminationDate = d;
    }

    if (typeof staff.vehicleType === "string") user.staff.vehicleType = staff.vehicleType.trim();
    if (staff.availabilityStatus !== undefined) {
      if (!availabilityStatuses.includes(staff.availabilityStatus)) {
        return res.status(400).json({ message: "availabilityStatus must be available, busy, or offline" });
      }
      user.staff.availabilityStatus = staff.availabilityStatus;
    }
  }

  if (user.role === "chef" || user.role === "waiter") {
    const addr = String(user.staff?.address || "").trim();
    const exp = String(user.staff?.experience || "").trim();
    const monthlySalary = user.staff?.monthlySalary;
    const salaryPayDay = user.staff?.salaryPayDay;
    const startDate = user.staff?.startDate;

    if (!addr || !exp || typeof monthlySalary !== "number" || monthlySalary < 0) {
      return res.status(400).json({ message: "Chef/Waiter require staff.address, staff.experience and staff.monthlySalary" });
    }

    if (!Number.isInteger(Number(salaryPayDay)) || salaryPayDay < 1 || salaryPayDay > 31) {
      return res.status(400).json({ message: "Chef/Waiter require staff.salaryPayDay (1-31)" });
    }

    if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "Chef/Waiter require staff.startDate" });
    }
  }

  await user.save();

  await writeAuditLog({
    actor: req.user,
    action: actorRole === "hr" ? "hr.staff_update" : "admin.staff_update",
    entityType: "User",
    entityId: user._id,
    meta: { prev, next: { name: user.name, email: user.email, phone: user.phone, role: user.role, isBlocked: user.isBlocked, staff: user.staff } },
  });

  const safe = await User.findById(user._id).select("-passwordHash").lean();
  return res.json({ user: safe || user });
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (String(id) === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }

  const user = await User.findById(id).lean();
  if (!user) return res.status(404).json({ message: "Staff not found" });

  if (!canActorManageRole(req.user.role, user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Prevent deleting delivery staff that were already linked to orders.
  const linked = await Order.countDocuments({
    $or: [{ assignedDeliveryUserId: id }, { deliveryAssignedByUserId: id }],
  });
  if (linked > 0) {
    return res.status(400).json({ message: "Cannot delete staff linked to orders. Deactivate instead." });
  }

  await User.findByIdAndDelete(id);

  await writeAuditLog({
    actor: req.user,
    action: req.user.role === "hr" ? "hr.staff_delete" : "admin.staff_delete",
    entityType: "User",
    entityId: id,
    meta: { email: user.email, role: user.role },
  });

  return res.json({ message: "Staff deleted" });
});

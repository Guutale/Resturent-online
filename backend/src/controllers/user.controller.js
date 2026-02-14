import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Order from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../utils/audit.js";

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const ROLES = ["user", "admin", "dispatcher", "delivery", "chef", "waiter"];
const isRole = (value) => ROLES.includes(value);
const isStaffRole = (value) => value === "dispatcher" || value === "delivery" || value === "chef" || value === "waiter";

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const normalizePhone = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const ensureStaffObject = (user) => {
  if (!user.staff) user.staff = {};
  return user.staff;
};

const applyStaffPatch = (user, staffPatch) => {
  if (!staffPatch || typeof staffPatch !== "object") return;
  const staff = ensureStaffObject(user);

  if (typeof staffPatch.nationalId === "string") staff.nationalId = staffPatch.nationalId.trim();
  if (typeof staffPatch.address === "string") staff.address = staffPatch.address.trim();
  if (typeof staffPatch.experience === "string") staff.experience = staffPatch.experience.trim();

  if (staffPatch.monthlySalary !== undefined) {
    const v = Number(staffPatch.monthlySalary);
    if (!Number.isFinite(v) || v < 0) {
      const err = new Error("monthlySalary must be a non-negative number");
      err.statusCode = 400;
      throw err;
    }
    staff.monthlySalary = v;
  }

  if (staffPatch.salaryPayDay !== undefined) {
    const v = Number(staffPatch.salaryPayDay);
    if (!Number.isInteger(v) || v < 1 || v > 31) {
      const err = new Error("salaryPayDay must be an integer from 1 to 31");
      err.statusCode = 400;
      throw err;
    }
    staff.salaryPayDay = v;
  }

  if (staffPatch.startDate !== undefined) {
    const d = new Date(staffPatch.startDate);
    if (Number.isNaN(d.getTime())) {
      const err = new Error("startDate must be a valid date");
      err.statusCode = 400;
      throw err;
    }
    staff.startDate = d;
  }

  if (typeof staffPatch.vehicleType === "string") staff.vehicleType = staffPatch.vehicleType.trim();

  if (staffPatch.availabilityStatus !== undefined) {
    const allowed = ["available", "busy", "offline"];
    if (!allowed.includes(staffPatch.availabilityStatus)) {
      const err = new Error("availabilityStatus must be available, busy, or offline");
      err.statusCode = 400;
      throw err;
    }
    staff.availabilityStatus = staffPatch.availabilityStatus;
  }
};

export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (typeof name === "string" && name.trim()) user.name = name.trim();
  if (typeof phone === "string") user.phone = phone.trim();

  await user.save();

  return res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      addresses: user.addresses,
      staff: user.staff,
    },
  });
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required" });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: "newPassword must be at least 6 characters" });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const matched = await bcrypt.compare(String(currentPassword), user.passwordHash);
  if (!matched) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await user.save();

  await writeAuditLog({
    actor: req.user,
    action: "user.change_password",
    entityType: "User",
    entityId: user._id,
  });

  return res.json({ message: "Password updated" });
});

export const addAddress = asyncHandler(async (req, res) => {
  const { label = "Home", city, district, street, notes, isDefault = false } = req.body;

  if (!city || !district || !street) {
    return res.status(400).json({ message: "city, district and street are required" });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (isDefault) {
    user.addresses = user.addresses.map((addr) => ({ ...addr.toObject(), isDefault: false }));
  }

  user.addresses.push({ label, city, district, street, notes, isDefault });
  await user.save();

  return res.status(201).json({ addresses: user.addresses });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const idx = user.addresses.findIndex((a) => String(a._id) === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Address not found" });
  }

  const patch = req.body;
  if (patch.isDefault === true) {
    user.addresses = user.addresses.map((addr) => ({ ...addr.toObject(), isDefault: false }));
  }

  const target = user.addresses[idx];
  ["label", "city", "district", "street", "notes", "isDefault"].forEach((key) => {
    if (patch[key] !== undefined) target[key] = patch[key];
  });

  await user.save();
  return res.json({ addresses: user.addresses });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const originalCount = user.addresses.length;
  user.addresses = user.addresses.filter((a) => String(a._id) !== id);

  if (user.addresses.length === originalCount) {
    return res.status(404).json({ message: "Address not found" });
  }

  await user.save();
  return res.json({ addresses: user.addresses });
});

export const adminListUsers = asyncHandler(async (req, res) => {
  const { search, role, isBlocked } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};

  if (role && isRole(role)) {
    filter.role = role;
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

export const adminGetUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash").lean();
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user });
});

export const adminCreateUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, staff } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: "password must be at least 6 characters" });
  }

  const nextRole = isRole(role) ? role : "user";
  const normalizedPhone = normalizePhone(phone);

  if (isStaffRole(nextRole) && !normalizedPhone) {
    return res.status(400).json({ message: "phone is required for staff accounts" });
  }

  const existingEmail = await User.findOne({ email: normalizedEmail }).lean();
  if (existingEmail) {
    return res.status(400).json({ message: "Email already in use" });
  }

  if (normalizedPhone) {
    const existingPhone = await User.findOne({ phone: normalizedPhone }).lean();
    if (existingPhone) {
      return res.status(400).json({ message: "Phone already in use" });
    }
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  const doc = {
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: nextRole,
    phone: normalizedPhone || undefined,
    staff: undefined,
  };

  if (staff && typeof staff === "object") {
    doc.staff = {};
    if (typeof staff.nationalId === "string") doc.staff.nationalId = staff.nationalId.trim();
    if (typeof staff.address === "string") doc.staff.address = staff.address.trim();
    if (typeof staff.experience === "string") doc.staff.experience = staff.experience.trim();
    if (typeof staff.vehicleType === "string") doc.staff.vehicleType = staff.vehicleType.trim();
    if (staff.availabilityStatus && ["available", "busy", "offline"].includes(staff.availabilityStatus)) {
      doc.staff.availabilityStatus = staff.availabilityStatus;
    }

    if (staff.monthlySalary !== undefined) {
      const v = Number(staff.monthlySalary);
      if (!Number.isFinite(v) || v < 0) {
        return res.status(400).json({ message: "monthlySalary must be a non-negative number" });
      }
      doc.staff.monthlySalary = v;
    }

    if (staff.salaryPayDay !== undefined) {
      const v = Number(staff.salaryPayDay);
      if (!Number.isInteger(v) || v < 1 || v > 31) {
        return res.status(400).json({ message: "salaryPayDay must be an integer from 1 to 31" });
      }
      doc.staff.salaryPayDay = v;
    }

    if (staff.startDate !== undefined) {
      const d = new Date(staff.startDate);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ message: "startDate must be a valid date" });
      }
      doc.staff.startDate = d;
    }
  }

  if (nextRole === "chef" || nextRole === "waiter") {
    const addr = String(staff?.address || "").trim();
    const exp = String(staff?.experience || "").trim();
    const monthlySalary = Number(staff?.monthlySalary);
    const salaryPayDay = Number(staff?.salaryPayDay);
    const startDate = new Date(staff?.startDate);

    if (!addr || !exp || !Number.isFinite(monthlySalary) || monthlySalary < 0) {
      return res.status(400).json({ message: "address, experience and monthlySalary are required for chef/waiter" });
    }

    if (!Number.isInteger(salaryPayDay) || salaryPayDay < 1 || salaryPayDay > 31) {
      return res.status(400).json({ message: "salaryPayDay (1-31) is required for chef/waiter" });
    }

    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "startDate is required for chef/waiter" });
    }

    doc.staff = {
      ...(doc.staff || {}),
      address: addr,
      experience: exp,
      monthlySalary,
      salaryPayDay,
      startDate,
    };

    if (typeof staff?.nationalId === "string" && staff.nationalId.trim()) {
      doc.staff.nationalId = staff.nationalId.trim();
    }
  }

  const user = await User.create(doc);

  await writeAuditLog({
    actor: req.user,
    action: "admin.user_create",
    entityType: "User",
    entityId: user._id,
    meta: { email: user.email, role: user.role },
  });

  return res.status(201).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      staff: user.staff,
      isBlocked: user.isBlocked,
    },
  });
});

export const adminUpdateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isBlocked, role, name, email, phone, staff } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isSelf = String(user._id) === req.user.id;
  if (isSelf) {
    return res.status(400).json({ message: "You cannot update your own admin account via this endpoint" });
  }

  const nextRole = isRole(role) ? role : undefined;
  const nextEmail = email !== undefined ? normalizeEmail(email) : undefined;
  const nextPhone = phone !== undefined ? normalizePhone(phone) : undefined;

  if (user.role === "admin" && user.isBlocked === false) {
    const isBlockingAdmin = typeof isBlocked === "boolean" && isBlocked === true && user.isBlocked === false;
    const isDemotingAdmin = nextRole && nextRole !== "admin";

    if (isBlockingAdmin || isDemotingAdmin) {
      const otherActiveAdmins = await User.countDocuments({
        role: "admin",
        isBlocked: false,
        _id: { $ne: user._id },
      });
      if (otherActiveAdmins === 0) {
        return res.status(400).json({ message: "Cannot remove or block the last active admin" });
      }
    }
  }

  const prev = { role: user.role, isBlocked: user.isBlocked, name: user.name, email: user.email, phone: user.phone, staff: user.staff };

  if (typeof isBlocked === "boolean") user.isBlocked = isBlocked;
  if (nextRole) user.role = nextRole;
  if (typeof name === "string" && name.trim()) user.name = name.trim();

  if (nextEmail) {
    const existingEmail = await User.findOne({ email: nextEmail, _id: { $ne: user._id } }).lean();
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }
    user.email = nextEmail;
  }

  if (nextPhone !== undefined) {
    if (nextPhone) {
      const existingPhone = await User.findOne({ phone: nextPhone, _id: { $ne: user._id } }).lean();
      if (existingPhone) {
        return res.status(400).json({ message: "Phone already in use" });
      }
      user.phone = nextPhone;
    } else {
      user.phone = "";
    }
  }

  applyStaffPatch(user, staff);

  if (isStaffRole(user.role) && !normalizePhone(user.phone)) {
    return res.status(400).json({ message: "phone is required for staff accounts" });
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
    action: "admin.user_update",
    entityType: "User",
    entityId: user._id,
    meta: { prev, next: { role: user.role, isBlocked: user.isBlocked, name: user.name, email: user.email, phone: user.phone, staff: user.staff } },
  });

  return res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      staff: user.staff,
      isBlocked: user.isBlocked,
    },
  });
});

export const adminDeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (String(id) === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own admin account" });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role === "admin" && user.isBlocked === false) {
    const otherActiveAdmins = await User.countDocuments({
      role: "admin",
      isBlocked: false,
      _id: { $ne: user._id },
    });
    if (otherActiveAdmins === 0) {
      return res.status(400).json({ message: "Cannot delete the last active admin" });
    }
  }

  await User.findByIdAndDelete(id);

  await writeAuditLog({
    actor: req.user,
    action: "admin.user_delete",
    entityType: "User",
    entityId: id,
    meta: { email: user.email, role: user.role },
  });

  return res.json({ message: "User deleted" });
});

export const adminUserOrders = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { userId: id };
  const total = await Order.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const items = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json({ items, page, pages, total });
});

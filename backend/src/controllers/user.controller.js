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

const isRole = (value) => value === "user" || value === "admin" || value === "delivery";

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
    filter.$or = [{ name: rx }, { email: rx }];
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

export const adminUpdateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isBlocked, role } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isSelf = String(user._id) === req.user.id;
  if (isSelf) {
    return res.status(400).json({ message: "You cannot update your own admin account via this endpoint" });
  }

  const nextRole = isRole(role) ? role : undefined;

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

  const prev = { role: user.role, isBlocked: user.isBlocked };

  if (typeof isBlocked === "boolean") user.isBlocked = isBlocked;
  if (nextRole) user.role = nextRole;

  await user.save();

  await writeAuditLog({
    actor: req.user,
    action: "admin.user_update",
    entityType: "User",
    entityId: user._id,
    meta: { prev, next: { role: user.role, isBlocked: user.isBlocked } },
  });

  return res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
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

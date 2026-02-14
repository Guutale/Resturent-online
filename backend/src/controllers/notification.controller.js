import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const myNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { audience: "user", userId: req.user.id };

  const total = await Notification.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const items = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json({ items, page, pages, total });
});

export const adminNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { audience: "admin" };

  const total = await Notification.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const items = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json({ items, page, pages, total });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const note = await Notification.findById(req.params.id);
  if (!note) return res.status(404).json({ message: "Notification not found" });

  const isAdmin = req.user.role === "admin";
  const isUserOwner = note.audience === "user" && String(note.userId || "") === req.user.id;
  const isAdminAudience = note.audience === "admin" && isAdmin;

  if (!isUserOwner && !isAdminAudience) {
    return res.status(403).json({ message: "Forbidden" });
  }

  note.isRead = true;
  await note.save();

  return res.json({ item: note });
});

export const markAllMyNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ audience: "user", userId: req.user.id, isRead: false }, { $set: { isRead: true } });
  return res.json({ message: "OK" });
});

export const markAllAdminNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ audience: "admin", isRead: false }, { $set: { isRead: true } });
  return res.json({ message: "OK" });
});


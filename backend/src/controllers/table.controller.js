import DiningTable from "../models/DiningTable.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../utils/audit.js";

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 200);
  return { page, limit, skip: (page - 1) * limit };
};

const TABLE_STATUSES = ["available", "occupied", "reserved", "cleaning"];

const normalizePayload = (payload = {}, { partial = false } = {}) => {
  const next = {};

  if (!partial || payload.name !== undefined) {
    const name = String(payload.name || "").trim();
    if (!name) {
      const err = new Error("name is required");
      err.statusCode = 400;
      throw err;
    }
    next.name = name;
  }

  if (payload.zone !== undefined) next.zone = String(payload.zone || "").trim() || undefined;

  if (!partial || payload.capacity !== undefined) {
    const capacity = Number(payload.capacity);
    if (!Number.isInteger(capacity) || capacity < 1) {
      const err = new Error("capacity must be an integer greater than 0");
      err.statusCode = 400;
      throw err;
    }
    next.capacity = capacity;
  }

  if (payload.sortOrder !== undefined) {
    const sortOrder = Number(payload.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      const err = new Error("sortOrder must be numeric");
      err.statusCode = 400;
      throw err;
    }
    next.sortOrder = sortOrder;
  }

  if (payload.status !== undefined) {
    if (!TABLE_STATUSES.includes(payload.status)) {
      const err = new Error("status must be available, occupied, reserved, or cleaning");
      err.statusCode = 400;
      throw err;
    }
    next.status = payload.status;
  }

  if (payload.isActive !== undefined) {
    if (typeof payload.isActive !== "boolean") {
      const err = new Error("isActive must be boolean");
      err.statusCode = 400;
      throw err;
    }
    next.isActive = payload.isActive;
  }

  return next;
};

export const listTables = asyncHandler(async (req, res) => {
  const { search, status, isActive } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (search) {
    const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { zone: rx }];
  }
  if (status && TABLE_STATUSES.includes(status)) filter.status = status;
  if (isActive === "true") filter.isActive = true;
  if (isActive === "false") filter.isActive = false;

  const total = await DiningTable.countDocuments(filter);
  const pages = Math.ceil(total / limit);
  const items = await DiningTable.find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json({ items, page, pages, total });
});

export const createTable = asyncHandler(async (req, res) => {
  const payload = normalizePayload(req.body, { partial: false });
  const item = await DiningTable.create(payload);

  await writeAuditLog({
    actor: req.user,
    action: "admin.table_create",
    entityType: "DiningTable",
    entityId: item._id,
    meta: { name: item.name, status: item.status, capacity: item.capacity },
  });

  return res.status(201).json({ item });
});

export const updateTable = asyncHandler(async (req, res) => {
  const payload = normalizePayload(req.body, { partial: true });
  const item = await DiningTable.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Table not found" });

  const prev = {
    name: item.name,
    zone: item.zone,
    capacity: item.capacity,
    sortOrder: item.sortOrder,
    status: item.status,
    isActive: item.isActive,
  };

  Object.assign(item, payload);
  await item.save();

  await writeAuditLog({
    actor: req.user,
    action: "admin.table_update",
    entityType: "DiningTable",
    entityId: item._id,
    meta: { prev, next: payload },
  });

  return res.json({ item });
});

export const deleteTable = asyncHandler(async (req, res) => {
  const item = await DiningTable.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Table not found" });

  await writeAuditLog({
    actor: req.user,
    action: "admin.table_delete",
    entityType: "DiningTable",
    entityId: item._id,
    meta: { name: item.name },
  });

  return res.json({ message: "Table deleted" });
});

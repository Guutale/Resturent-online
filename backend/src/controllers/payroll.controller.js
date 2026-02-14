import SalaryPayment from "../models/SalaryPayment.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../utils/audit.js";

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const isPayrollRole = (value) => value === "chef" || value === "waiter" || value === "delivery" || value === "dispatcher";

const isValidMonth = (value) => {
  const s = String(value || "").trim();
  if (!/^\d{4}-\d{2}$/.test(s)) return false;
  const mm = Number(s.slice(5, 7));
  return mm >= 1 && mm <= 12;
};

export const adminListSalaryPayments = asyncHandler(async (req, res) => {
  const { month, role, staffId, status } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (month && isValidMonth(month)) filter.month = String(month);
  if (role && isPayrollRole(role)) filter.role = role;
  if (staffId) filter.staffId = staffId;
  if (status === "paid" || status === "unpaid") filter.status = status;

  const total = await SalaryPayment.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const items = await SalaryPayment.find(filter)
    .sort({ month: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("staffId", "name email phone role isBlocked staff")
    .lean();

  return res.json({ items, page, pages, total });
});

export const adminCreateSalaryPayment = asyncHandler(async (req, res) => {
  const { staffId, month, amount, paidAt, method, note, status } = req.body;

  if (!staffId || !month || amount === undefined) {
    return res.status(400).json({ message: "staffId, month and amount are required" });
  }

  if (!isValidMonth(month)) {
    return res.status(400).json({ message: "month must be in YYYY-MM format" });
  }

  const staffUser = await User.findById(staffId).select("_id role name email isBlocked").lean();
  if (!staffUser) {
    return res.status(400).json({ message: "Invalid staffId" });
  }

  if (!isPayrollRole(staffUser.role)) {
    return res.status(400).json({ message: "User role is not eligible for payroll" });
  }

  const v = Number(amount);
  if (!Number.isFinite(v) || v < 0) {
    return res.status(400).json({ message: "amount must be a non-negative number" });
  }

  const nextStatus = status === "unpaid" ? "unpaid" : "paid";

  let nextPaidAt;
  if (nextStatus === "paid") {
    if (paidAt !== undefined && paidAt !== null && String(paidAt).trim()) {
      const d = new Date(paidAt);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ message: "paidAt must be a valid date" });
      }
      nextPaidAt = d;
    } else {
      nextPaidAt = new Date();
    }
  }

  const nextMethod = typeof method === "string" ? method.trim() : "";
  if (nextStatus === "paid" && !["cash", "bank_transfer"].includes(nextMethod)) {
    return res.status(400).json({ message: "method must be cash or bank_transfer for paid salaries" });
  }

  const existing = await SalaryPayment.findOne({ staffId, month }).lean();
  if (existing) {
    return res.status(400).json({ message: "Salary payment for this staff and month already exists" });
  }

  const item = await SalaryPayment.create({
    staffId,
    role: staffUser.role,
    month: String(month),
    amount: v,
    status: nextStatus,
    paidAt: nextPaidAt,
    method: nextMethod || undefined,
    note: typeof note === "string" ? note.trim() : undefined,
    createdByUserId: req.user.id,
  });

  await writeAuditLog({
    actor: req.user,
    action: "admin.salary_payment_create",
    entityType: "SalaryPayment",
    entityId: item._id,
    meta: { staffId, role: staffUser.role, month: item.month, amount: item.amount, status: item.status },
  });

  const populated = await SalaryPayment.findById(item._id)
    .populate("staffId", "name email phone role isBlocked staff")
    .lean();

  return res.status(201).json({ item: populated || item });
});

export const adminGetSalaryPayment = asyncHandler(async (req, res) => {
  const item = await SalaryPayment.findById(req.params.id)
    .populate("staffId", "name email phone role isBlocked staff")
    .lean();
  if (!item) return res.status(404).json({ message: "Salary payment not found" });
  return res.json({ item });
});

export const adminUpdateSalaryPayment = asyncHandler(async (req, res) => {
  const { status, paidAt, method, note, amount } = req.body;

  const item = await SalaryPayment.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Salary payment not found" });

  const prev = { status: item.status, paidAt: item.paidAt, method: item.method, note: item.note, amount: item.amount };

  if (amount !== undefined) {
    const v = Number(amount);
    if (!Number.isFinite(v) || v < 0) return res.status(400).json({ message: "amount must be a non-negative number" });
    item.amount = v;
  }

  if (status !== undefined) {
    if (status !== "paid" && status !== "unpaid") {
      return res.status(400).json({ message: "status must be paid or unpaid" });
    }
    item.status = status;
  }

  if (note !== undefined) {
    item.note = typeof note === "string" ? note.trim() : "";
  }

  if (method !== undefined) {
    const v = typeof method === "string" ? method.trim() : "";
    if (v && !["cash", "bank_transfer"].includes(v)) {
      return res.status(400).json({ message: "method must be cash or bank_transfer" });
    }
    item.method = v || undefined;
  }

  if (paidAt !== undefined) {
    if (paidAt === null || String(paidAt).trim() === "") {
      item.paidAt = undefined;
    } else {
      const d = new Date(paidAt);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ message: "paidAt must be a valid date" });
      }
      item.paidAt = d;
    }
  }

  if (item.status === "paid") {
    if (!item.paidAt) item.paidAt = new Date();
    if (!item.method) item.method = "cash";
  }

  if (item.status === "unpaid") {
    item.paidAt = undefined;
    item.method = undefined;
  }

  await item.save();

  await writeAuditLog({
    actor: req.user,
    action: "admin.salary_payment_update",
    entityType: "SalaryPayment",
    entityId: item._id,
    meta: { prev, next: { status: item.status, paidAt: item.paidAt, method: item.method, note: item.note, amount: item.amount } },
  });

  const populated = await SalaryPayment.findById(item._id)
    .populate("staffId", "name email phone role isBlocked staff")
    .lean();

  return res.json({ item: populated || item });
});

export const adminStaffSalaryPayments = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { page, limit, skip } = parsePagination(req.query);

  const total = await SalaryPayment.countDocuments({ staffId });
  const pages = Math.ceil(total / limit);

  const items = await SalaryPayment.find({ staffId })
    .sort({ month: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json({ items, page, pages, total });
});

export const adminPayrollReport = asyncHandler(async (req, res) => {
  const { month, role } = req.query;

  const match = {};
  if (month && isValidMonth(month)) match.month = String(month);
  if (role && isPayrollRole(role)) match.role = role;

  const rows = await SalaryPayment.aggregate([
    { $match: match },
    {
      $group: {
        _id: { role: "$role", status: "$status" },
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.role": 1, "_id.status": 1 } },
  ]);

  return res.json({ rows });
});


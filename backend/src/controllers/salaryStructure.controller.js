import SalaryStructure from "../models/SalaryStructure.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../utils/audit.js";

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 200);
  return { page, limit, skip: (page - 1) * limit };
};

const isStaffRole = (role) => role === "chef" || role === "waiter" || role === "delivery";

export const listSalaryStructures = asyncHandler(async (req, res) => {
  const { staffUserId, role } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (staffUserId) filter.staffUserId = staffUserId;
  if (role && isStaffRole(role)) filter.role = role;

  const total = await SalaryStructure.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const items = await SalaryStructure.find(filter)
    .sort({ effectiveFrom: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("staffUserId", "name email phone role isBlocked staff")
    .lean();

  return res.json({ items, page, pages, total });
});

export const getCurrentSalaryStructure = asyncHandler(async (req, res) => {
  const { staffUserId } = req.params;
  const item = await SalaryStructure.findOne({ staffUserId })
    .sort({ effectiveFrom: -1, createdAt: -1 })
    .populate("staffUserId", "name email phone role isBlocked staff")
    .lean();
  if (!item) return res.status(404).json({ message: "Salary structure not found" });
  return res.json({ item });
});

export const createSalaryStructure = asyncHandler(async (req, res) => {
  const { staffUserId, baseSalary, salaryPayDay, allowances = 0, deductions = 0, effectiveFrom } = req.body;

  if (!staffUserId || baseSalary === undefined || salaryPayDay === undefined || !effectiveFrom) {
    return res.status(400).json({ message: "staffUserId, baseSalary, salaryPayDay and effectiveFrom are required" });
  }

  const staffUser = await User.findById(staffUserId).select("_id role staff").lean();
  if (!staffUser) return res.status(400).json({ message: "Invalid staffUserId" });
  if (!isStaffRole(staffUser.role)) return res.status(400).json({ message: "User role must be chef, waiter, or delivery" });

  const bs = Number(baseSalary);
  if (!Number.isFinite(bs) || bs < 0) return res.status(400).json({ message: "baseSalary must be a non-negative number" });

  const pd = Number(salaryPayDay);
  if (!Number.isInteger(pd) || pd < 1 || pd > 31) return res.status(400).json({ message: "salaryPayDay must be an integer from 1 to 31" });

  const a = Number(allowances);
  if (!Number.isFinite(a) || a < 0) return res.status(400).json({ message: "allowances must be a non-negative number" });

  const d = Number(deductions);
  if (!Number.isFinite(d) || d < 0) return res.status(400).json({ message: "deductions must be a non-negative number" });

  const ef = new Date(effectiveFrom);
  if (Number.isNaN(ef.getTime())) return res.status(400).json({ message: "effectiveFrom must be a valid date" });

  const item = await SalaryStructure.create({
    staffUserId,
    role: staffUser.role,
    baseSalary: bs,
    salaryPayDay: pd,
    allowances: a,
    deductions: d,
    effectiveFrom: ef,
    createdByUserId: req.user.id,
  });

  // Keep compatibility with older UI by mirroring salary fields onto User.staff.
  await User.updateOne(
    { _id: staffUserId },
    {
      $set: {
        "staff.monthlySalary": bs,
        "staff.salaryPayDay": pd,
      },
    }
  ).catch(() => {});

  await writeAuditLog({
    actor: req.user,
    action: req.user.role === "hr" ? "hr.salary_structure_create" : "admin.salary_structure_create",
    entityType: "SalaryStructure",
    entityId: item._id,
    meta: { staffUserId, role: staffUser.role, baseSalary: bs, salaryPayDay: pd, effectiveFrom: ef },
  });

  const populated = await SalaryStructure.findById(item._id)
    .populate("staffUserId", "name email phone role isBlocked staff")
    .lean();

  return res.status(201).json({ item: populated || item });
});

export const updateSalaryStructure = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { baseSalary, salaryPayDay, allowances, deductions, effectiveFrom } = req.body;

  const item = await SalaryStructure.findById(id);
  if (!item) return res.status(404).json({ message: "Salary structure not found" });

  const prev = {
    baseSalary: item.baseSalary,
    salaryPayDay: item.salaryPayDay,
    allowances: item.allowances,
    deductions: item.deductions,
    effectiveFrom: item.effectiveFrom,
  };

  if (baseSalary !== undefined) {
    const v = Number(baseSalary);
    if (!Number.isFinite(v) || v < 0) return res.status(400).json({ message: "baseSalary must be a non-negative number" });
    item.baseSalary = v;
  }

  if (salaryPayDay !== undefined) {
    const v = Number(salaryPayDay);
    if (!Number.isInteger(v) || v < 1 || v > 31) return res.status(400).json({ message: "salaryPayDay must be an integer from 1 to 31" });
    item.salaryPayDay = v;
  }

  if (allowances !== undefined) {
    const v = Number(allowances);
    if (!Number.isFinite(v) || v < 0) return res.status(400).json({ message: "allowances must be a non-negative number" });
    item.allowances = v;
  }

  if (deductions !== undefined) {
    const v = Number(deductions);
    if (!Number.isFinite(v) || v < 0) return res.status(400).json({ message: "deductions must be a non-negative number" });
    item.deductions = v;
  }

  if (effectiveFrom !== undefined) {
    const d = new Date(effectiveFrom);
    if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "effectiveFrom must be a valid date" });
    item.effectiveFrom = d;
  }

  await item.save();

  // Mirror to User.staff for compatibility if this is the newest structure.
  const newest = await SalaryStructure.findOne({ staffUserId: item.staffUserId }).sort({ effectiveFrom: -1, createdAt: -1 }).lean();
  if (newest && String(newest._id) === String(item._id)) {
    await User.updateOne(
      { _id: item.staffUserId },
      {
        $set: {
          "staff.monthlySalary": item.baseSalary,
          "staff.salaryPayDay": item.salaryPayDay,
        },
      }
    ).catch(() => {});
  }

  await writeAuditLog({
    actor: req.user,
    action: req.user.role === "hr" ? "hr.salary_structure_update" : "admin.salary_structure_update",
    entityType: "SalaryStructure",
    entityId: item._id,
    meta: { prev, next: { baseSalary: item.baseSalary, salaryPayDay: item.salaryPayDay, allowances: item.allowances, deductions: item.deductions, effectiveFrom: item.effectiveFrom } },
  });

  const populated = await SalaryStructure.findById(item._id)
    .populate("staffUserId", "name email phone role isBlocked staff")
    .lean();

  return res.json({ item: populated || item });
});


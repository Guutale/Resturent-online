import Payment from "../models/Payment.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

export const revenueSummary = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const match = {};
  const fromDate = toDate(from);
  const toDateValue = toDate(to);
  if (fromDate || toDateValue) {
    match.createdAt = {};
    if (fromDate) match.createdAt.$gte = fromDate;
    if (toDateValue) match.createdAt.$lte = toDateValue;
  }

  const rows = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: { status: "$paymentStatus" },
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.status": 1 } },
  ]);

  const byStatus = {};
  rows.forEach((r) => {
    byStatus[String(r._id.status)] = { count: Number(r.count || 0), totalAmount: Number(r.totalAmount || 0) };
  });

  const paid = byStatus.paid || { count: 0, totalAmount: 0 };
  const unpaid = byStatus.unpaid || { count: 0, totalAmount: 0 };
  const refunded = byStatus.refunded || { count: 0, totalAmount: 0 };

  return res.json({
    summary: {
      paid,
      unpaid,
      refunded,
      totalCount: paid.count + unpaid.count + refunded.count,
      grossAmount: paid.totalAmount + unpaid.totalAmount,
      netAmount: paid.totalAmount - refunded.totalAmount,
    },
  });
});


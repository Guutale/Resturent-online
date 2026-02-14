import mongoose from "mongoose";

const SalaryPaymentSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: {
      type: String,
      enum: ["chef", "waiter", "delivery", "dispatcher"],
      required: true,
      index: true,
    },
    month: { type: String, required: true, trim: true, index: true }, // YYYY-MM
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["paid", "unpaid"], default: "paid", index: true },
    paidAt: { type: Date },
    method: { type: String, enum: ["cash", "bank_transfer"], trim: true },
    note: { type: String, trim: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SalaryPaymentSchema.index({ staffId: 1, month: 1 }, { unique: true });

export default mongoose.model("SalaryPayment", SalaryPaymentSchema);


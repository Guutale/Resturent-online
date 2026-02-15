import mongoose from "mongoose";

const SalaryStructureSchema = new mongoose.Schema(
  {
    staffUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["chef", "waiter", "delivery"], required: true, index: true },
    baseSalary: { type: Number, required: true, min: 0 },
    salaryPayDay: { type: Number, required: true, min: 1, max: 31 },
    allowances: { type: Number, min: 0, default: 0 },
    deductions: { type: Number, min: 0, default: 0 },
    effectiveFrom: { type: Date, required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SalaryStructureSchema.index({ staffUserId: 1, effectiveFrom: 1 }, { unique: true });

export default mongoose.model("SalaryStructure", SalaryStructureSchema);


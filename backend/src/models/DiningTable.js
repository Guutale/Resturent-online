import mongoose from "mongoose";

const DiningTableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    zone: { type: String, trim: true },
    capacity: { type: Number, min: 1, default: 2 },
    sortOrder: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "cleaning"],
      default: "available",
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

DiningTableSchema.index({ name: 1 }, { unique: true });

export default mongoose.model("DiningTable", DiningTableSchema);

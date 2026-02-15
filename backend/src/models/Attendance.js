import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    staffUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true, index: true }, // normalized to local midnight by API
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    notes: { type: String, trim: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

AttendanceSchema.index({ staffUserId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", AttendanceSchema);


import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  label: {
    type: String,
    enum: ["Home", "Work", "Other"],
    default: "Home",
  },
  city: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  notes: { type: String, trim: true },
  isDefault: { type: Boolean, default: false },
});

const StaffSchema = new mongoose.Schema(
  {
    nationalId: { type: String, trim: true },
    address: { type: String, trim: true },
    experience: { type: String, trim: true },
    monthlySalary: { type: Number, min: 0 },
    salaryPayDay: { type: Number, min: 1, max: 31 },
    startDate: { type: Date },
    // Daily shift schedule (HH:mm). Attendance check-in/out is stored separately.
    timeIn: { type: String, trim: true },
    timeOut: { type: String, trim: true },
    employmentStatus: {
      type: String,
      enum: ["active", "on_leave", "suspended", "terminated"],
      default: "active",
      index: true,
    },
    terminationReason: { type: String, trim: true },
    terminationDate: { type: Date },

    vehicleType: { type: String, trim: true },
    availabilityStatus: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "offline",
      index: true,
    },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin", "hr", "finance", "dispatcher", "delivery", "chef", "waiter"],
      default: "user",
      index: true,
    },
    phone: { type: String, trim: true },
    addresses: { type: [AddressSchema], default: [] },
    staff: { type: StaffSchema },
    isBlocked: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);

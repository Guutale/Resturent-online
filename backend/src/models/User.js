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
    role: { type: String, enum: ["user", "admin", "delivery"], default: "user", index: true },
    phone: { type: String, trim: true },
    addresses: { type: [AddressSchema], default: [] },
    isBlocked: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);

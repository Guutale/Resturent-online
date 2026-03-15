import mongoose from "mongoose";

const AuthBrandingSchema = new mongoose.Schema(
  {
    pageType: {
      type: String,
      enum: ["login", "register"],
      required: true,
      unique: true,
      index: true,
    },
    promoText: { type: String, trim: true, maxlength: 40 },
    heading: { type: String, required: true, trim: true, maxlength: 120 },
    subheading: { type: String, trim: true, maxlength: 180 },
    description: { type: String, trim: true, maxlength: 240 },
    imageUrl: { type: String, trim: true },
    overlayOpacity: { type: Number, min: 0.12, max: 0.88, default: 0.42 },
    textAlignment: {
      type: String,
      enum: ["left", "center", "right"],
      default: "left",
    },
    ctaText: { type: String, trim: true, maxlength: 40 },
    ctaLink: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

AuthBrandingSchema.index({ isActive: 1, pageType: 1 });

export default mongoose.model("AuthBranding", AuthBrandingSchema);

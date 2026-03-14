import mongoose from "mongoose";

const HeroSlideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 180 },
    category: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    originalPrice: { type: Number, required: true, min: 0.01 },
    discountType: {
      type: String,
      enum: ["none", "percentage", "fixed"],
      default: "none",
    },
    discountValue: { type: Number, min: 0, default: 0 },
    finalPrice: { type: Number, required: true, min: 0 },
    buttonText: { type: String, trim: true },
    buttonLink: { type: String, trim: true },
    autoplaySeconds: { type: Number, min: 1, max: 20, default: 5 },
    isActive: { type: Boolean, default: true, index: true },
    availabilityStatus: {
      type: String,
      enum: ["available", "unavailable", "out_of_stock"],
      default: "available",
      index: true,
    },
    priority: { type: Number, default: 0, index: true },
    startDate: { type: Date },
    endDate: { type: Date },
    displayOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

HeroSlideSchema.index({ isActive: 1, availabilityStatus: 1, priority: -1, displayOrder: 1 });

export default mongoose.model("HeroSlide", HeroSlideSchema);

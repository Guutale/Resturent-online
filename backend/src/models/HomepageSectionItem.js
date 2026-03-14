import mongoose from "mongoose";

const HomepageSectionItemSchema = new mongoose.Schema(
  {
    sectionKey: { type: String, required: true, index: true, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 220 },
    imageUrl: { type: String, trim: true },
    icon: { type: String, trim: true },
    labelText: { type: String, trim: true },
    category: { type: String, trim: true },
    originalPrice: { type: Number, min: 0 },
    discountType: {
      type: String,
      enum: ["none", "percentage", "fixed"],
      default: "none",
    },
    discountValue: { type: Number, min: 0, default: 0 },
    finalPrice: { type: Number, min: 0, default: 0 },
    buttonText: { type: String, trim: true },
    buttonLink: { type: String, trim: true },
    availabilityStatus: {
      type: String,
      enum: ["available", "unavailable", "out_of_stock"],
      default: "available",
      index: true,
    },
    badgeText: { type: String, trim: true },
    customerName: { type: String, trim: true },
    customerImageUrl: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

HomepageSectionItemSchema.index({ sectionKey: 1, isActive: 1, displayOrder: 1 });

export default mongoose.model("HomepageSectionItem", HomepageSectionItemSchema);

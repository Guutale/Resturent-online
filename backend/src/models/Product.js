import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    imageUrl: { type: String, trim: true },
    isAvailable: { type: Boolean, default: true, index: true },
    stockQty: { type: Number, min: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 5 },
    prepTimeMinutes: { type: Number, min: 0 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

ProductSchema.index({ title: "text", description: "text", tags: "text" });

export default mongoose.model("Product", ProductSchema);

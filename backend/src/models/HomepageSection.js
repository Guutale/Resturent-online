import mongoose from "mongoose";

const FooterLinkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    href: { type: String, trim: true },
  },
  { _id: false }
);

const HomepageSectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true, trim: true },
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true, maxlength: 240 },
    isVisible: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0, index: true },
    settings: {
      restaurantName: { type: String, trim: true },
      address: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      openingHours: { type: String, trim: true },
      facebookUrl: { type: String, trim: true },
      instagramUrl: { type: String, trim: true },
      tiktokUrl: { type: String, trim: true },
      footerLinks: { type: [FooterLinkSchema], default: [] },
    },
  },
  { timestamps: true }
);

HomepageSectionSchema.index({ isVisible: 1, displayOrder: 1 });

export default mongoose.model("HomepageSection", HomepageSectionSchema);

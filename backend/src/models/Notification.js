import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    audience: { type: String, enum: ["user", "admin"], required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, trim: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ audience: 1, userId: 1, createdAt: -1 });

export default mongoose.model("Notification", NotificationSchema);


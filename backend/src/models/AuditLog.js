import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    actorRole: { type: String, trim: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    entityType: { type: String, required: true, trim: true, index: true },
    entityId: { type: String, trim: true, index: true },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

export default mongoose.model("AuditLog", AuditLogSchema);


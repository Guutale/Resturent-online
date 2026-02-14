import AuditLog from "../models/AuditLog.js";

export const writeAuditLog = async ({ actor, action, entityType, entityId, meta }) => {
  try {
    await AuditLog.create({
      actorUserId: actor?.id,
      actorRole: actor?.role,
      action,
      entityType,
      entityId: entityId ? String(entityId) : undefined,
      meta,
    });
  } catch (err) {
    // Audit logs should never break the request flow.
    console.warn("Audit log failed:", err.message);
  }
};


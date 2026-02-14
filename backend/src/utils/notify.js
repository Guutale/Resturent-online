import Notification from "../models/Notification.js";

export const createNotification = async ({ audience, userId, title, message, type, data }) => {
  try {
    if (audience === "user" && !userId) return;
    await Notification.create({
      audience,
      userId: audience === "user" ? userId : undefined,
      title,
      message,
      type,
      data,
    });
  } catch (err) {
    // Notifications should not break the request flow.
    console.warn("Notification create failed:", err.message);
  }
};


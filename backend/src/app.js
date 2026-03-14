import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import payrollRoutes from "./routes/payroll.routes.js";
import deliveryStaffRoutes from "./routes/deliveryStaff.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import salaryStructureRoutes from "./routes/salaryStructure.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import heroSlideRoutes from "./routes/heroSlide.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

const app = express();

app.use(cors());
// Allow small proof screenshots (base64 data URLs) for manual payment verification.
app.use(express.json({ limit: "3mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/delivery-staff", deliveryStaffRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/salary-structures", salaryStructureRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/hero-slides", heroSlideRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

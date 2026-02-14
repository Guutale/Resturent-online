import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", trim: true },
    paymentMethod: { type: String, enum: ["COD", "CARD", "EVCPLUS"], required: true, index: true },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], required: true, index: true },
    paidAt: { type: Date },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", PaymentSchema);


import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    imageUrl: { type: String },
  },
  { _id: false }
);

const DeliveryAddressSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const StatusEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, required: true },
    byUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    byRole: { type: String },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const DeliveryLocationSchema = new mongoose.Schema(
  {
    lat: { type: Number },
    lng: { type: Number },
    mapsLink: { type: String, trim: true },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedDeliveryUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    deliveryAssignedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deliveryAssignedAt: { type: Date },
    outForDeliveryAt: { type: Date },
    preparedAt: { type: Date },
    failedAt: { type: Date },
    kitchenStatus: {
      type: String,
      enum: ["pending", "cooking", "ready"],
      default: "pending",
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ["unassigned", "assigned", "out_for_delivery", "delivered", "failed"],
      default: "unassigned",
      index: true,
    },
    deliveryLocation: { type: DeliveryLocationSchema },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    customer: { type: CustomerSchema, required: true },
    deliveryAddress: { type: DeliveryAddressSchema, required: true },
    paymentMethod: {
      type: String,
      enum: ["COD", "CARD", "EVCPLUS"],
      default: "COD",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "assigned", "out_for_delivery", "on_the_way", "delivered", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    statusHistory: { type: [StatusEventSchema], default: [] },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    adminNote: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);

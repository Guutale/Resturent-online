import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  const email = (process.env.ADMIN_EMAIL || "admin@mail.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Admin";

  await connectDB();

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.name = name;
    existing.role = "admin";
    existing.isBlocked = false;
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Admin updated: ${email}`);
  } else {
    await User.create({
      name,
      email,
      passwordHash,
      role: "admin",
      isBlocked: false,
    });
    console.log(`Admin created: ${email}`);
  }

  console.log("Password:", password);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Seed failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
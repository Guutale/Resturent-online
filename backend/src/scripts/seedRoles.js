import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const ensureUniqueEmails = (accounts) => {
  const emails = accounts.map((a) => a.email);
  const set = new Set(emails);
  if (set.size !== emails.length) {
    const dupes = emails.filter((e, idx) => emails.indexOf(e) !== idx);
    throw new Error(`Duplicate seed emails: ${[...new Set(dupes)].join(", ")}`);
  }
};

const upsertByEmail = async (account) => {
  const email = normalizeEmail(account.email);
  const password = String(account.password || "");
  const name = String(account.name || "").trim() || "User";
  const role = account.role;
  const phone = account.phone ? String(account.phone).trim() : undefined;

  if (!email || !password || password.length < 6) {
    throw new Error(`Invalid seed account config for role "${role}" (email/password)`);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.name = name;
    existing.role = role;
    existing.isBlocked = false;
    existing.passwordHash = passwordHash;
    if (phone) existing.phone = phone;
    if (account.staff && typeof account.staff === "object") {
      existing.staff = { ...(existing.staff || {}), ...account.staff };
    }
    await existing.save();
    return { email, password, role, updated: true };
  }

  await User.create({
    name,
    email,
    passwordHash,
    role,
    phone,
    staff: account.staff,
    isBlocked: false,
  });

  return { email, password, role, updated: false };
};

const run = async () => {
  const now = new Date();
  const startDate = process.env.SEED_STAFF_START_DATE ? new Date(process.env.SEED_STAFF_START_DATE) : now;

  const accounts = [
    {
      role: "admin",
      name: process.env.ADMIN_NAME || "Admin",
      email: process.env.ADMIN_EMAIL || "admin@mail.com",
      password: process.env.ADMIN_PASSWORD || "admin123",
      phone: process.env.ADMIN_PHONE || "0610000001",
    },
    {
      role: "dispatcher",
      name: process.env.DISPATCHER_NAME || "Dispatcher",
      email: process.env.DISPATCHER_EMAIL || "dispatcher@mail.com",
      password: process.env.DISPATCHER_PASSWORD || "dispatcher123",
      phone: process.env.DISPATCHER_PHONE || "0610000002",
      staff: {
        address: "Mogadishu",
        experience: "1 year",
        monthlySalary: 300,
        salaryPayDay: 25,
        startDate,
      },
    },
    {
      role: "chef",
      name: process.env.CHEF_NAME || "Chef",
      email: process.env.CHEF_EMAIL || "chef@mail.com",
      password: process.env.CHEF_PASSWORD || "chef123",
      phone: process.env.CHEF_PHONE || "0610000003",
      staff: {
        address: "Mogadishu",
        experience: "3 years",
        monthlySalary: 450,
        salaryPayDay: 25,
        startDate,
      },
    },
    {
      role: "waiter",
      name: process.env.WAITER_NAME || "Waiter",
      email: process.env.WAITER_EMAIL || "waiter@mail.com",
      password: process.env.WAITER_PASSWORD || "waiter123",
      phone: process.env.WAITER_PHONE || "0610000004",
      staff: {
        address: "Mogadishu",
        experience: "2 years",
        monthlySalary: 250,
        salaryPayDay: 25,
        startDate,
      },
    },
    {
      role: "delivery",
      name: process.env.DELIVERY_NAME || "Delivery",
      email: process.env.DELIVERY_EMAIL || "delivery@mail.com",
      password: process.env.DELIVERY_PASSWORD || "delivery123",
      phone: process.env.DELIVERY_PHONE || "0610000005",
      staff: {
        vehicleType: "Motorbike",
        availabilityStatus: "available",
        monthlySalary: 220,
        salaryPayDay: 25,
        startDate,
      },
    },
    {
      role: "user",
      name: process.env.USER_NAME || "User",
      email: process.env.USER_EMAIL || "user@mail.com",
      password: process.env.USER_PASSWORD || "user123",
      phone: process.env.USER_PHONE || "0610000006",
    },
  ];

  ensureUniqueEmails(accounts.map((a) => ({ ...a, email: normalizeEmail(a.email) })));

  await connectDB();

  const results = [];
  for (const a of accounts) {
    results.push(await upsertByEmail(a));
  }

  console.log("");
  console.log("Seed roles complete. Credentials:");
  results.forEach((r) => {
    const action = r.updated ? "updated" : "created";
    console.log(`- ${r.role.padEnd(10)} ${r.email.padEnd(22)} ${r.password} (${action})`);
  });

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Seed failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});


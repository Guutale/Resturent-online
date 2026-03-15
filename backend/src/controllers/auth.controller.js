import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  addresses: user.addresses,
  staff: user.staff,
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const normalizedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPhone = String(phone || "").trim();

  if (!normalizedName || !normalizedEmail || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
    return res.status(400).json({
      message: "password must be at least 8 characters and include at least one letter and one number",
    });
  }

  if (normalizedPhone && !/^[0-9+()\-\s]{7,20}$/.test(normalizedPhone)) {
    return res.status(400).json({ message: "phone must be a valid phone number" });
  }

  const exists = await User.findOne({ email: normalizedEmail }).lean();
  if (exists) {
    return res.status(400).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
    phone: normalizedPhone,
  });

  const token = signToken({ id: user._id, role: user.role });
  return res.status(201).json({ user: sanitizeUser(user), token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.isBlocked) {
    return res.status(403).json({ message: "Your account is blocked" });
  }

  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ id: user._id, role: user.role });
  return res.json({ user: sanitizeUser(user), token });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user });
});

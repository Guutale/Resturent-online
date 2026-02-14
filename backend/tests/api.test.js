import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcryptjs";

import app from "../src/app.js";
import User from "../src/models/User.js";
import Category from "../src/models/Category.js";
import Product from "../src/models/Product.js";

const originalFns = {
  userFindOne: User.findOne,
  userCreate: User.create,
  userFindById: User.findById,
  categoryCreate: Category.create,
  productCountDocuments: Product.countDocuments,
};

test.before(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_EXPIRES_IN = "1d";
});

const restoreMocks = () => {
  User.findOne = originalFns.userFindOne;
  User.create = originalFns.userCreate;
  User.findById = originalFns.userFindById;
  Category.create = originalFns.categoryCreate;
  Product.countDocuments = originalFns.productCountDocuments;
};

test.afterEach(() => {
  restoreMocks();
});

test("health endpoint returns ok", async () => {
  const res = await request(app).get("/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test("register endpoint returns token and user", async () => {
  User.findOne = () => ({ lean: async () => null });
  User.create = async ({ name, email }) => ({
    _id: "u1",
    name,
    email,
    role: "user",
    phone: "",
    addresses: [],
  });

  const res = await request(app).post("/api/auth/register").send({
    name: "Ali",
    email: "ALI@mail.com",
    password: "123456",
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, "ali@mail.com");
  assert.equal(res.body.user.role, "user");
  assert.ok(res.body.token);
});

test("login endpoint rejects wrong password", async () => {
  User.findOne = async () => ({
    _id: "u1",
    email: "ali@mail.com",
    passwordHash: "$2a$10$hashthatwillnotmatch",
    isBlocked: false,
  });

  const res = await request(app).post("/api/auth/login").send({
    email: "ali@mail.com",
    password: "wrong",
  });

  assert.equal(res.status, 401);
  assert.match(res.body.message, /invalid credentials/i);
});

test("protected admin endpoint rejects missing token", async () => {
  const res = await request(app).post("/api/categories").send({ name: "Quraac" });
  assert.equal(res.status, 401);
  assert.match(res.body.message, /unauthorized/i);
});

test("category delete safety check blocks deletion when linked products exist", async () => {
  const passwordHash = await bcrypt.hash("admin123", 10);
  User.findOne = async () => ({
    _id: "admin-id",
    name: "Admin",
    email: "admin@mail.com",
    role: "admin",
    isBlocked: false,
    passwordHash,
    phone: "",
    addresses: [],
  });

  Product.countDocuments = async () => 2;
  User.findById = (id) => ({
    select: () => ({ lean: async () => ({ _id: id, role: "admin", isBlocked: false }) }),
  });

  const adminTokenRes = await request(app).post("/api/auth/login").send({
    email: "admin@mail.com",
    password: "admin123",
  });

  assert.equal(adminTokenRes.status, 200);

  const deleteRes = await request(app)
    .delete("/api/categories/cat-id")
    .set("Authorization", `Bearer ${adminTokenRes.body.token}`);

  assert.equal(deleteRes.status, 400);
  assert.match(deleteRes.body.message, /linked products/i);
});

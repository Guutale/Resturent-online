import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { slugify } from "../utils/slugify.js";
import { writeAuditLog } from "../utils/audit.js";

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 12, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const listProducts = asyncHandler(async (req, res) => {
  const { category, search, sort = "-createdAt" } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};

  if (category) {
    const categoryDoc = await Category.findOne({ slug: String(category).toLowerCase() }).select("_id").lean();
    if (!categoryDoc) return res.json({ items: [], page, pages: 0, total: 0 });
    filter.categoryId = categoryDoc._id;
  }

  if (search) {
    filter.$text = { $search: String(search) };
  }

  const total = await Product.countDocuments(filter);
  const pages = Math.ceil(total / limit);

  const items = await Product.find(filter)
    .populate("categoryId", "name slug")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  return res.json({ items, page, pages, total });
});

export const getProduct = asyncHandler(async (req, res) => {
  const item = await Product.findById(req.params.id).populate("categoryId", "name slug").lean();

  if (!item) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.json({ item });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { title, description, price, categoryId, imageUrl, isAvailable, prepTimeMinutes, tags = [], stockQty, lowStockThreshold } = req.body;

  if (!title || price === undefined || !categoryId) {
    return res.status(400).json({ message: "title, price and categoryId are required" });
  }

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ message: "Invalid price" });
  }

  const numericStockQty =
    stockQty === undefined || stockQty === null || stockQty === ""
      ? undefined
      : Number(stockQty);
  if (numericStockQty !== undefined && (!Number.isInteger(numericStockQty) || numericStockQty < 0)) {
    return res.status(400).json({ message: "stockQty must be a non-negative integer" });
  }

  const numericLowStockThreshold =
    lowStockThreshold === undefined || lowStockThreshold === null || lowStockThreshold === ""
      ? undefined
      : Number(lowStockThreshold);
  if (
    numericLowStockThreshold !== undefined
    && (!Number.isInteger(numericLowStockThreshold) || numericLowStockThreshold < 0)
  ) {
    return res.status(400).json({ message: "lowStockThreshold must be a non-negative integer" });
  }

  const category = await Category.findById(categoryId).lean();
  if (!category) {
    return res.status(400).json({ message: "Invalid categoryId" });
  }

  const slug = slugify(title);
  const exists = await Product.findOne({ slug }).lean();
  if (exists) {
    return res.status(400).json({ message: "Product title already exists" });
  }

  const normalizedAvailability =
    numericStockQty === 0 ? false : typeof isAvailable === "boolean" ? isAvailable : undefined;

  const product = await Product.create({
    title,
    slug,
    description,
    price: numericPrice,
    categoryId,
    imageUrl,
    isAvailable: normalizedAvailability,
    stockQty: numericStockQty,
    lowStockThreshold: numericLowStockThreshold,
    prepTimeMinutes,
    tags,
  });

  await writeAuditLog({
    actor: req.user,
    action: "admin.product_create",
    entityType: "Product",
    entityId: product._id,
    meta: { title: product.title, price: product.price, categoryId: product.categoryId },
  });

  return res.status(201).json({ item: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const prev = {
    title: product.title,
    price: product.price,
    categoryId: product.categoryId,
    isAvailable: product.isAvailable,
    stockQty: product.stockQty,
    lowStockThreshold: product.lowStockThreshold,
  };

  if (payload.title) {
    product.title = payload.title;
    product.slug = slugify(payload.title);
  }

  if (payload.description !== undefined) product.description = payload.description;
  if (payload.imageUrl !== undefined) product.imageUrl = payload.imageUrl;

  if (payload.isAvailable !== undefined) {
    if (typeof payload.isAvailable !== "boolean") {
      return res.status(400).json({ message: "isAvailable must be boolean" });
    }
    product.isAvailable = payload.isAvailable;
  }

  if (payload.tags !== undefined) {
    if (!Array.isArray(payload.tags)) {
      return res.status(400).json({ message: "tags must be an array" });
    }
    product.tags = payload.tags;
  }

  if (payload.prepTimeMinutes !== undefined) {
    const n = Number(payload.prepTimeMinutes);
    if (!Number.isFinite(n) || n < 0) return res.status(400).json({ message: "Invalid prepTimeMinutes" });
    product.prepTimeMinutes = n;
  }

  if (payload.price !== undefined) {
    const n = Number(payload.price);
    if (!Number.isFinite(n) || n < 0) return res.status(400).json({ message: "Invalid price" });
    product.price = n;
  }

  if (payload.stockQty !== undefined) {
    if (payload.stockQty === null || payload.stockQty === "") {
      product.stockQty = undefined;
    } else {
      const n = Number(payload.stockQty);
      if (!Number.isInteger(n) || n < 0) return res.status(400).json({ message: "stockQty must be a non-negative integer" });
      product.stockQty = n;
      if (n === 0) product.isAvailable = false;
    }
  }

  if (payload.lowStockThreshold !== undefined) {
    if (payload.lowStockThreshold === null || payload.lowStockThreshold === "") {
      product.lowStockThreshold = undefined;
    } else {
      const n = Number(payload.lowStockThreshold);
      if (!Number.isInteger(n) || n < 0) return res.status(400).json({ message: "lowStockThreshold must be a non-negative integer" });
      product.lowStockThreshold = n;
    }
  }

  if (payload.categoryId) {
    const category = await Category.findById(payload.categoryId).lean();
    if (!category) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }
    product.categoryId = payload.categoryId;
  }

  await product.save();
  await writeAuditLog({
    actor: req.user,
    action: "admin.product_update",
    entityType: "Product",
    entityId: product._id,
    meta: { prev, next: { title: product.title, price: product.price, categoryId: product.categoryId, isAvailable: product.isAvailable, stockQty: product.stockQty, lowStockThreshold: product.lowStockThreshold } },
  });
  return res.json({ item: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Product not found" });
  }

  await writeAuditLog({
    actor: req.user,
    action: "admin.product_delete",
    entityType: "Product",
    entityId: deleted._id,
    meta: { title: deleted.title },
  });

  return res.json({ message: "Product deleted" });
});

export const toggleAvailability = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;
  if (typeof isAvailable !== "boolean") {
    return res.status(400).json({ message: "isAvailable must be boolean" });
  }

  const item = await Product.findByIdAndUpdate(
    req.params.id,
    { isAvailable },
    { new: true, runValidators: true }
  );

  if (!item) {
    return res.status(404).json({ message: "Product not found" });
  }

  await writeAuditLog({
    actor: req.user,
    action: "admin.product_toggle_availability",
    entityType: "Product",
    entityId: item._id,
    meta: { isAvailable: item.isAvailable },
  });

  return res.json({ item });
});

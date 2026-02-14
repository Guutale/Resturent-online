import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { slugify } from "../utils/slugify.js";
import { writeAuditLog } from "../utils/audit.js";

export const adminListCategories = asyncHandler(async (req, res) => {
  const items = await Category.find().sort({ name: 1 }).lean();
  return res.json({ items });
});

export const listCategories = asyncHandler(async (req, res) => {
  const items = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  return res.json({ items });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, imageUrl } = req.body;
  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }

  const slug = slugify(name);
  const exists = await Category.findOne({ $or: [{ name }, { slug }] }).lean();
  if (exists) {
    return res.status(400).json({ message: "Category already exists" });
  }

  const category = await Category.create({ name, slug, imageUrl });
  await writeAuditLog({
    actor: req.user,
    action: "admin.category_create",
    entityType: "Category",
    entityId: category._id,
    meta: { name: category.name, slug: category.slug },
  });
  return res.status(201).json({ category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, imageUrl, isActive } = req.body;

  const category = await Category.findById(id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  const prev = { name: category.name, slug: category.slug, imageUrl: category.imageUrl, isActive: category.isActive };

  if (typeof name === "string" && name.trim()) {
    category.name = name.trim();
    category.slug = slugify(name);
  }
  if (imageUrl !== undefined) category.imageUrl = imageUrl;
  if (typeof isActive === "boolean") category.isActive = isActive;

  await category.save();
  await writeAuditLog({
    actor: req.user,
    action: "admin.category_update",
    entityType: "Category",
    entityId: category._id,
    meta: { prev, next: { name: category.name, slug: category.slug, imageUrl: category.imageUrl, isActive: category.isActive } },
  });
  return res.json({ category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const linkedProducts = await Product.countDocuments({ categoryId: id });
  if (linkedProducts > 0) {
    return res.status(400).json({
      message: "Cannot delete category with linked products",
      linkedProducts,
    });
  }

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  await writeAuditLog({
    actor: req.user,
    action: "admin.category_delete",
    entityType: "Category",
    entityId: id,
    meta: { name: category.name, slug: category.slug },
  });

  return res.json({ message: "Category deleted" });
});

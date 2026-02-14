import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

const AdminCategoriesPage = () => {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", imageUrl: "", isActive: true });

  const load = () =>
    apiRequest("/categories/admin")
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((c) => String(c.name || "").toLowerCase().includes(needle) || String(c.slug || "").toLowerCase().includes(needle));
  }, [items, q]);

  const openCreate = () => {
    setError("");
    setEditing(null);
    setForm({ name: "", imageUrl: "", isActive: true });
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setError("");
    setEditing(category);
    setForm({
      name: category?.name || "",
      imageUrl: category?.imageUrl || "",
      isActive: Boolean(category?.isActive),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (!form.name.trim()) throw new Error("Category name is required");

      if (editing?._id) {
        await apiRequest(`/categories/${editing._id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name,
            imageUrl: form.imageUrl,
            isActive: form.isActive,
          }),
        });
      } else {
        await apiRequest("/categories", {
          method: "POST",
          body: JSON.stringify({ name: form.name, imageUrl: form.imageUrl }),
        });
      }

      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category) => {
    setError("");
    try {
      await apiRequest(`/categories/${category._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const del = async (category) => {
    setError("");
    const ok = window.confirm(`Delete category "${category.name}"?`);
    if (!ok) return;
    try {
      await apiRequest(`/categories/${category._id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Categories</h1>
          <p className="admin-subtitle">Create, edit, and disable categories.</p>
        </div>
        <div className="admin-actions">
          <div className="admin-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              className="admin-input"
              placeholder="Search categories..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button type="button" className="admin-btn-primary" onClick={openCreate}>
            <i className="fa-solid fa-plus" /> Add Category
          </button>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-surface">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 800 }}>{c.name}</td>
                  <td className="admin-muted">{c.slug}</td>
                  <td>
                    <div className="admin-status-cell">
                      <button
                        type="button"
                        className={`admin-switch${c.isActive ? " checked" : ""}`}
                        onClick={() => toggleActive(c)}
                        aria-pressed={c.isActive}
                        aria-label={c.isActive ? "Disable category" : "Enable category"}
                      >
                        <span className="admin-switch-thumb" />
                      </button>
                      <span className={`badge ${c.isActive ? "delivered" : "cancelled"}`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="admin-icon-btn" onClick={() => openEdit(c)} aria-label="Edit">
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button type="button" className="admin-icon-btn danger" onClick={() => del(c)} aria-label="Delete">
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-empty-cell">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="admin-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="admin-modal animate-scale-up" role="dialog" aria-modal="true">
            <div className="admin-modal-head row-between">
              <h3 className="admin-modal-title">{editing ? "Edit Category" : "New Category"}</h3>
              <button type="button" className="admin-icon-btn" onClick={closeModal} aria-label="Close">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form className="admin-form" onSubmit={onSubmit}>
              <label className="admin-label">Name</label>
              <input
                className="admin-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Quraac"
              />

              <label className="admin-label">Image URL (optional)</label>
              <input
                className="admin-input"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
              />

              {editing && (
                <div className="admin-form-row">
                  <div>
                    <div className="admin-label" style={{ marginBottom: 2 }}>Active</div>
                    <div className="admin-muted">Hide from customer menu when disabled.</div>
                  </div>
                  <button
                    type="button"
                    className={`admin-switch${form.isActive ? " checked" : ""}`}
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    aria-pressed={form.isActive}
                  >
                    <span className="admin-switch-thumb" />
                  </button>
                </div>
              )}

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;

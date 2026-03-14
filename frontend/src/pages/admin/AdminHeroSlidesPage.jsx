import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import {
  buildHeroSlidePayload,
  computeHeroFinalPrice,
  createHeroSlideFormState,
  normalizeHeroSlide,
  toHeroSlideFormState,
  validateHeroSlideForm,
} from "../../lib/heroSlides";

const availabilityOptions = [
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Unavailable" },
  { value: "out_of_stock", label: "Out of stock" },
];

const formatSchedule = (item) => {
  if (!item.startDate && !item.endDate) return "Always on";
  if (item.startDate && item.endDate) return `${item.startDate} to ${item.endDate}`;
  if (item.startDate) return `Starts ${item.startDate}`;
  return `Ends ${item.endDate}`;
};

const AdminHeroSlidesPage = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(createHeroSlideFormState());

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/hero-slides/admin");
      setItems((data.items || []).map(normalizeHeroSlide));
      setError("");
    } catch (err) {
      setItems([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeCount = useMemo(() => items.filter((item) => item.isActive).length, [items]);
  const visibleCount = useMemo(() => items.filter((item) => item.isCurrentlyVisible).length, [items]);
  const computedFinalPrice = computeHeroFinalPrice(form.originalPrice, form.discountType, form.discountValue);

  const openCreate = () => {
    setError("");
    setFormError("");
    setEditing(null);
    setForm(createHeroSlideFormState());
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setError("");
    setFormError("");
    setEditing(item);
    setForm(toHeroSlideFormState(item));
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFormError("");

    const validationErrors = validateHeroSlideForm(form);
    if (validationErrors.length) {
      setFormError(validationErrors[0]);
      return;
    }

    setSaving(true);
    try {
      const payload = buildHeroSlidePayload(form);

      if (editing?._id) {
        await apiRequest(`/hero-slides/${editing._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/hero-slides", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item) => {
    setError("");
    try {
      await apiRequest(`/hero-slides/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (item) => {
    setError("");
    const ok = window.confirm(`Delete banner "${item.title}"?`);
    if (!ok) return;

    try {
      await apiRequest(`/hero-slides/${item._id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const moveSlide = async (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const reordered = [...items];
    const [current] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, current);

    setReordering(true);
    setError("");
    try {
      const data = await apiRequest("/hero-slides/reorder", {
        method: "PATCH",
        body: JSON.stringify({ orderedIds: reordered.map((item) => item._id) }),
      });
      setItems((data.items || []).map(normalizeHeroSlide));
    } catch (err) {
      setError(err.message);
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Hero Banners</h1>
          <p className="admin-subtitle">
            Manage homepage slides, discounts, availability, schedule rules, and autoplay timing.
          </p>
        </div>

        <div className="admin-actions">
          <div className="admin-segment">
            <button type="button" className="admin-segment-btn active">
              {visibleCount} visible
            </button>
            <button type="button" className="admin-segment-btn">
              {activeCount} active
            </button>
            <button type="button" className="admin-segment-btn">
              {items.length} total
            </button>
          </div>

          <button type="button" className="admin-btn-primary" onClick={openCreate}>
            <i className="fa-solid fa-plus" />
            Add Banner
          </button>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {loading ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon"><i className="fa-solid fa-spinner" /></div>
          <div className="admin-empty-title">Loading hero banners...</div>
        </div>
      ) : (
        <div className="admin-banner-grid">
          {items.map((item, index) => (
            <article key={item._id} className="admin-banner-card animate-fade-in">
              <div className="admin-banner-media">
                <img src={item.imageUrl} alt={item.title} loading="lazy" />
                <div className="admin-banner-overlay" />
                <div className="admin-banner-preview">
                  <div className="admin-banner-badge-row">
                    <span className="admin-banner-chip">{item.category}</span>
                    {item.discountBadge && <span className="admin-banner-discount">{item.discountBadge}</span>}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description || "Homepage promotional banner preview."}</p>
                  <div className="admin-banner-pricing">
                    {item.hasDiscount && (
                      <span className="admin-banner-original">${item.originalPrice.toFixed(2)}</span>
                    )}
                    <strong>${item.finalPrice.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              <div className="admin-banner-body">
                <div className="admin-banner-status-row">
                  <span className={`badge ${item.isCurrentlyVisible ? "ready" : "pending"}`}>
                    {item.isCurrentlyVisible ? "Visible now" : "Hidden now"}
                  </span>
                  <span className={`badge ${item.isActive ? "role-admin" : "failed"}`}>
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="badge">{availabilityOptions.find((entry) => entry.value === item.availabilityStatus)?.label || item.availabilityStatus}</span>
                </div>

                <div className="admin-banner-meta">
                  <div className="detail-meta-card">
                    <span className="detail-meta-label">Autoplay</span>
                    <strong>{item.autoplaySeconds}s</strong>
                  </div>
                  <div className="detail-meta-card">
                    <span className="detail-meta-label">Priority</span>
                    <strong>{item.priority}</strong>
                  </div>
                  <div className="detail-meta-card">
                    <span className="detail-meta-label">Order</span>
                    <strong>{index + 1}</strong>
                  </div>
                  <div className="detail-meta-card">
                    <span className="detail-meta-label">Schedule</span>
                    <strong>{formatSchedule(item)}</strong>
                  </div>
                </div>

                <div className="admin-banner-actions">
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="admin-icon-btn"
                      onClick={() => moveSlide(index, -1)}
                      disabled={reordering || index === 0}
                      aria-label="Move up"
                    >
                      <i className="fa-solid fa-arrow-up" />
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn"
                      onClick={() => moveSlide(index, 1)}
                      disabled={reordering || index === items.length - 1}
                      aria-label="Move down"
                    >
                      <i className="fa-solid fa-arrow-down" />
                    </button>
                  </div>

                  <div className="admin-row-actions">
                    <button type="button" className="admin-icon-btn" onClick={() => openEdit(item)} aria-label="Edit">
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button type="button" className="admin-icon-btn" onClick={() => toggleActive(item)} aria-label="Toggle active">
                      <i className={`fa-solid ${item.isActive ? "fa-eye" : "fa-eye-slash"}`} />
                    </button>
                    <button type="button" className="admin-icon-btn danger" onClick={() => remove(item)} aria-label="Delete">
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {items.length === 0 && (
            <div className="admin-empty-state">
              <div className="admin-empty-icon"><i className="fa-solid fa-images" /></div>
              <div className="admin-empty-title">No hero banners yet</div>
              <div className="admin-muted">Create the first homepage promotion banner.</div>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="admin-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="admin-modal admin-modal-lg animate-scale-up" role="dialog" aria-modal="true">
            <div className="admin-modal-head row-between">
              <h3 className="admin-modal-title">{editing ? "Edit Hero Banner" : "New Hero Banner"}</h3>
              <button type="button" className="admin-icon-btn" onClick={closeModal} aria-label="Close">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {formError && <div className="admin-alert admin-form-alert">{formError}</div>}

            <form className="admin-form-grid" onSubmit={onSubmit}>
              <div className="admin-form-col">
                <label className="admin-label">Title</label>
                <input
                  className="admin-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Weekend burger rush"
                />

                <label className="admin-label">Description</label>
                <textarea
                  className="admin-input"
                  rows={4}
                  maxLength={180}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Keep the homepage description short and clean."
                />
                <div className="admin-muted">Short copy works best. Keep this to one or two lines in the hero.</div>

                <div className="admin-form-2col">
                  <div>
                    <label className="admin-label">Category</label>
                    <input
                      className="admin-input"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Burger combo"
                    />
                  </div>
                  <div>
                    <label className="admin-label">Autoplay Seconds</label>
                    <input
                      className="admin-input"
                      type="number"
                      min="1"
                      max="20"
                      value={form.autoplaySeconds}
                      onChange={(e) => setForm({ ...form, autoplaySeconds: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-2col">
                  <div>
                    <label className="admin-label">Original Price</label>
                    <input
                      className="admin-input"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.originalPrice}
                      onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Priority</label>
                    <input
                      className="admin-input"
                      type="number"
                      step="1"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-2col">
                  <div>
                    <label className="admin-label">Discount Type</label>
                    <select
                      className="admin-select admin-input"
                      value={form.discountType}
                      onChange={(e) => setForm({
                        ...form,
                        discountType: e.target.value,
                        discountValue: e.target.value === "none" ? "" : form.discountValue,
                      })}
                    >
                      <option value="none">No discount</option>
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">Discount Value</label>
                    <input
                      className="admin-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discountType === "none" ? "" : form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                      disabled={form.discountType === "none"}
                      placeholder={form.discountType === "percentage" ? "25" : "3"}
                    />
                  </div>
                </div>

                <div className="admin-form-2col">
                  <div>
                    <label className="admin-label">Final Price</label>
                    <input className="admin-input" value={`$${computedFinalPrice.toFixed(2)}`} readOnly />
                  </div>
                  <div>
                    <label className="admin-label">Availability</label>
                    <select
                      className="admin-select admin-input"
                      value={form.availabilityStatus}
                      onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })}
                    >
                      {availabilityOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-2col">
                  <div>
                    <label className="admin-label">Start Date</label>
                    <input
                      className="admin-input"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="admin-label">End Date</label>
                    <input
                      className="admin-input"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-2col">
                  <div>
                    <label className="admin-label">CTA Text</label>
                    <input
                      className="admin-input"
                      value={form.buttonText}
                      onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                      placeholder="Order now"
                    />
                  </div>
                  <div>
                    <label className="admin-label">CTA Link</label>
                    <input
                      className="admin-input"
                      value={form.buttonLink}
                      onChange={(e) => setForm({ ...form, buttonLink: e.target.value })}
                      placeholder="/menu"
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div>
                    <div className="admin-label" style={{ marginBottom: 2 }}>Active</div>
                    <div className="admin-muted">Only active banners can be considered for the homepage hero.</div>
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
              </div>

              <div className="admin-form-col">
                <div className="admin-upload">
                  <div className="admin-upload-preview">
                    <img src={form.imageUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200"} alt="Banner preview" />
                  </div>
                  <div className="admin-upload-body">
                    <div className="admin-upload-title">Background Image</div>
                    <div className="admin-muted">Use a wide image URL for the hero banner.</div>
                    <input
                      className="admin-input"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https://..."
                      style={{ marginTop: 10 }}
                    />
                  </div>
                </div>

                <div className="admin-banner-mini-preview">
                  <div className="admin-banner-mini-overlay" />
                  <img
                    src={form.imageUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200"}
                    alt="Hero preview"
                  />
                  <div className="admin-banner-mini-content">
                    <div className="admin-banner-badge-row">
                      <span className="admin-banner-chip">{form.category || "Promotion"}</span>
                      {form.discountType !== "none" && form.discountValue && (
                        <span className="admin-banner-discount">
                          {form.discountType === "percentage"
                            ? `${Number(form.discountValue || 0)}% OFF`
                            : `Save $${Number(form.discountValue || 0).toFixed(0)}`}
                        </span>
                      )}
                    </div>
                    <h4>{form.title || "Banner title preview"}</h4>
                    <p>{form.description || "The homepage banner description preview appears here."}</p>
                    <div className="admin-banner-pricing">
                      {form.discountType !== "none" && Number(form.discountValue || 0) > 0 && (
                        <span className="admin-banner-original">${Number(form.originalPrice || 0).toFixed(2)}</span>
                      )}
                      <strong>${computedFinalPrice.toFixed(2)}</strong>
                    </div>
                    <div className="admin-banner-status-row">
                      <span className={`badge ${form.isActive ? "ready" : "pending"}`}>
                        {form.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="badge">
                        {availabilityOptions.find((option) => option.value === form.availabilityStatus)?.label || "Available"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-modal-actions admin-modal-actions-span">
                <button type="button" className="admin-btn-secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editing ? "Save Banner" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHeroSlidesPage;

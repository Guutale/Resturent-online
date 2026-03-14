import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import {
  buildHomepageItemPayload,
  buildHomepageSectionPayload,
  createHomepageItemForm,
  createHomepageSectionForm,
  HOMEPAGE_SECTION_DEFINITIONS,
  normalizeHomepageContent,
  normalizeHomepageItem,
  toHomepageItemForm,
  validateHomepageItemForm,
  validateHomepageSectionForm,
} from "../../lib/homepageContent";
import { computeHeroFinalPrice } from "../../lib/heroSlides";

const socialFields = [
  { key: "facebookUrl", label: "Facebook URL" },
  { key: "instagramUrl", label: "Instagram URL" },
  { key: "tiktokUrl", label: "TikTok URL" },
];

const ItemPreview = ({ sectionKey, form }) => {
  const computedPrice = sectionKey === "featured-foods"
    ? computeHeroFinalPrice(form.originalPrice, form.discountType, form.discountValue)
    : Number(form.originalPrice || 0);
  const previewDiscount = form.discountType === "percentage"
    ? `${Number(form.discountValue || 0)}% OFF`
    : form.discountType === "fixed"
      ? `Save $${Number(form.discountValue || 0).toFixed(0)}`
      : "";

  return (
    <div className="admin-homepage-preview">
      <div className="admin-homepage-preview-media">
        {(form.imageUrl || form.customerImageUrl) ? (
          <img src={form.imageUrl || form.customerImageUrl} alt="Preview" />
        ) : (
          <div className="admin-homepage-preview-placeholder">
            <i className={form.icon || "fa-solid fa-image"} />
          </div>
        )}
      </div>
      <div className="admin-homepage-preview-body">
        <div className="admin-banner-badge-row">
          {form.category && <span className="admin-banner-chip">{form.category}</span>}
          {form.badgeText && <span className="admin-banner-discount">{form.badgeText}</span>}
          {!form.badgeText && previewDiscount && <span className="admin-banner-discount">{previewDiscount}</span>}
        </div>
        <h4>{form.title || form.customerName || "Preview title"}</h4>
        {(form.description || form.labelText) && <p>{form.description || form.labelText}</p>}
        {(sectionKey === "featured-foods" || sectionKey === "best-sellers") && (
          <div className="admin-banner-pricing">
            {sectionKey === "featured-foods" && form.discountType !== "none" && Number(form.discountValue || 0) > 0 && (
              <span className="admin-banner-original">${Number(form.originalPrice || 0).toFixed(2)}</span>
            )}
            <strong>${computedPrice.toFixed(2)}</strong>
          </div>
        )}
        {sectionKey === "testimonials" && (
          <div className="testimonial-stars">
            {Array.from({ length: 5 }).map((_, index) => (
              <i
                key={`preview-star-${index}`}
                className={`fa-solid fa-star${index < Number(form.rating || 0) ? " is-filled" : ""}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const renderItemCardMeta = (sectionKey, item) => {
  switch (sectionKey) {
    case "categories":
      return item.labelText || item.description || "Category card";
    case "featured-foods":
      return `${item.category} • ${item.hasDiscount ? item.discountBadge : `$${item.finalPrice.toFixed(2)}`}`;
    case "special-offers":
      return `${item.discountBadge || "Offer"}${item.startDate || item.endDate ? ` • ${item.startDate || "Now"}${item.endDate ? ` to ${item.endDate}` : ""}` : ""}`;
    case "why-choose-us":
      return item.description;
    case "best-sellers":
      return `${item.badgeText || "Premium item"} • $${item.originalPrice.toFixed(2)}`;
    case "testimonials":
      return `${item.rating} stars`;
    default:
      return "";
  }
};

const AdminHomepageManagementPage = () => {
  const [content, setContent] = useState({ sections: [], sectionsByKey: {} });
  const [activeTab, setActiveTab] = useState(HOMEPAGE_SECTION_DEFINITIONS[0].key);
  const [sectionForm, setSectionForm] = useState(createHomepageSectionForm(HOMEPAGE_SECTION_DEFINITIONS[0].key));
  const [itemForm, setItemForm] = useState(createHomepageItemForm(HOMEPAGE_SECTION_DEFINITIONS[0].key));
  const [editingItem, setEditingItem] = useState(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/homepage-content/admin");
      setContent(normalizeHomepageContent(data));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const currentSection = content.sectionsByKey[activeTab];
  const currentIndex = content.sections.findIndex((section) => section.key === activeTab);
  const currentDefinition = useMemo(
    () => HOMEPAGE_SECTION_DEFINITIONS.find((definition) => definition.key === activeTab),
    [activeTab]
  );

  useEffect(() => {
    setSectionForm(createHomepageSectionForm(activeTab, currentSection));
  }, [activeTab, currentSection]);

  const openCreateItem = () => {
    setFormError("");
    setEditingItem(null);
    setItemForm(createHomepageItemForm(activeTab));
    setItemModalOpen(true);
  };

  const openEditItem = (item) => {
    setFormError("");
    setEditingItem(item);
    setItemForm(toHomepageItemForm(activeTab, item));
    setItemModalOpen(true);
  };

  const closeItemModal = () => {
    if (savingItem) return;
    setItemModalOpen(false);
  };

  const saveSection = async () => {
    const validationErrors = validateHomepageSectionForm(activeTab, sectionForm);
    if (validationErrors.length) {
      setError(validationErrors[0]);
      return;
    }

    setSavingSection(true);
    setError("");
    try {
      await apiRequest(`/homepage-content/sections/${activeTab}`, {
        method: "PATCH",
        body: JSON.stringify(buildHomepageSectionPayload(activeTab, sectionForm)),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSection(false);
    }
  };

  const moveSection = async (direction) => {
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= content.sections.length) return;

    const reordered = [...content.sections];
    const [selected] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, selected);

    setReordering(true);
    setError("");
    try {
      await apiRequest("/homepage-content/sections/reorder", {
        method: "PATCH",
        body: JSON.stringify({ orderedKeys: reordered.map((section) => section.key) }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setReordering(false);
    }
  };

  const onSubmitItem = async (e) => {
    e.preventDefault();
    const validationErrors = validateHomepageItemForm(activeTab, itemForm);
    if (validationErrors.length) {
      setFormError(validationErrors[0]);
      return;
    }

    setSavingItem(true);
    setFormError("");
    try {
      const payload = buildHomepageItemPayload(activeTab, itemForm);
      if (editingItem?._id) {
        await apiRequest(`/homepage-content/items/${editingItem._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest(`/homepage-content/sections/${activeTab}/items`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setItemModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSavingItem(false);
    }
  };

  const toggleItem = async (item) => {
    setError("");
    try {
      await apiRequest(`/homepage-content/items/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteItem = async (item) => {
    const confirmed = window.confirm(`Delete "${item.title || item.customerName}"?`);
    if (!confirmed) return;

    setError("");
    try {
      await apiRequest(`/homepage-content/items/${item._id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const moveItem = async (index, direction) => {
    if (!currentSection?.items) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= currentSection.items.length) return;

    const reordered = [...currentSection.items];
    const [selected] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, selected);

    setReordering(true);
    setError("");
    try {
      await apiRequest(`/homepage-content/sections/${activeTab}/items/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ orderedIds: reordered.map((item) => item._id) }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setReordering(false);
    }
  };

  const updateFooterLink = (index, field, value) => {
    setSectionForm((current) => ({
      ...current,
      settings: {
        ...current.settings,
        footerLinks: (current.settings?.footerLinks || []).map((entry, entryIndex) => (
          entryIndex === index ? { ...entry, [field]: value } : entry
        )),
      },
    }));
  };

  const addFooterLink = () => {
    setSectionForm((current) => ({
      ...current,
      settings: {
        ...current.settings,
        footerLinks: [...(current.settings?.footerLinks || []), { label: "", href: "" }],
      },
    }));
  };

  const removeFooterLink = (index) => {
    setSectionForm((current) => ({
      ...current,
      settings: {
        ...current.settings,
        footerLinks: (current.settings?.footerLinks || []).filter((_, entryIndex) => entryIndex !== index),
      },
    }));
  };

  const itemPreview = useMemo(
    () => normalizeHomepageItem(activeTab, buildHomepageItemPayload(activeTab, itemForm)),
    [activeTab, itemForm]
  );

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Homepage Management</h1>
          <p className="admin-subtitle">
            Manage every homepage section after the hero slider from one admin or HR workspace.
          </p>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-homepage-tabs">
        {(content.sections.length === 0 ? HOMEPAGE_SECTION_DEFINITIONS : content.sections).map((section) => (
          <button
            key={section.key}
            type="button"
            className={`admin-homepage-tab ${activeTab === section.key ? "active" : ""}`}
            onClick={() => setActiveTab(section.key)}
          >
            {section.label}
          </button>
        ))}
      </div>

      {loading || !currentSection ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon"><i className="fa-solid fa-spinner" /></div>
          <div className="admin-empty-title">Loading homepage content...</div>
        </div>
      ) : (
        <>
          <div className="admin-homepage-layout">
            <section className="admin-surface admin-homepage-config">
              <div className="admin-surface-head">
                <div className="row-between">
                  <div>
                    <h2 className="admin-surface-title">{currentDefinition?.label}</h2>
                    <p className="admin-surface-subtitle">
                      Control section title, subtitle, visibility, and display order.
                    </p>
                  </div>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="admin-icon-btn"
                      onClick={() => moveSection(-1)}
                      disabled={reordering || currentIndex <= 0}
                      aria-label="Move section up"
                    >
                      <i className="fa-solid fa-arrow-up" />
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn"
                      onClick={() => moveSection(1)}
                      disabled={reordering || currentIndex === content.sections.length - 1}
                      aria-label="Move section down"
                    >
                      <i className="fa-solid fa-arrow-down" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="admin-form-grid admin-form-grid-single">
                <div className="admin-form-col">
                  <label className="admin-label">Section Title</label>
                  <input
                    className="admin-input"
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm((current) => ({ ...current, title: e.target.value }))}
                  />

                  <label className="admin-label">Section Subtitle</label>
                  <textarea
                    className="admin-input"
                    rows={3}
                    value={sectionForm.subtitle}
                    onChange={(e) => setSectionForm((current) => ({ ...current, subtitle: e.target.value }))}
                  />

                  <div className="admin-form-2col">
                    <div>
                      <label className="admin-label">Section Order</label>
                      <input
                        className="admin-input"
                        type="number"
                        value={sectionForm.displayOrder}
                        onChange={(e) => setSectionForm((current) => ({ ...current, displayOrder: e.target.value }))}
                      />
                    </div>
                    <div className="admin-form-row admin-form-row-tight">
                      <div>
                        <div className="admin-label" style={{ marginBottom: 2 }}>Visible</div>
                        <div className="admin-muted">Only visible sections appear on the homepage.</div>
                      </div>
                      <button
                        type="button"
                        className={`admin-switch${sectionForm.isVisible ? " checked" : ""}`}
                        onClick={() => setSectionForm((current) => ({ ...current, isVisible: !current.isVisible }))}
                        aria-pressed={sectionForm.isVisible}
                      >
                        <span className="admin-switch-thumb" />
                      </button>
                    </div>
                  </div>

                  {activeTab === "footer" && (
                    <div className="admin-homepage-footer-fields">
                      <div className="admin-form-2col">
                        <div>
                          <label className="admin-label">Restaurant Name</label>
                          <input
                            className="admin-input"
                            value={sectionForm.settings.restaurantName}
                            onChange={(e) => setSectionForm((current) => ({
                              ...current,
                              settings: { ...current.settings, restaurantName: e.target.value },
                            }))}
                          />
                        </div>
                        <div>
                          <label className="admin-label">Phone</label>
                          <input
                            className="admin-input"
                            value={sectionForm.settings.phone}
                            onChange={(e) => setSectionForm((current) => ({
                              ...current,
                              settings: { ...current.settings, phone: e.target.value },
                            }))}
                          />
                        </div>
                      </div>

                      <div className="admin-form-2col">
                        <div>
                          <label className="admin-label">Email</label>
                          <input
                            className="admin-input"
                            value={sectionForm.settings.email}
                            onChange={(e) => setSectionForm((current) => ({
                              ...current,
                              settings: { ...current.settings, email: e.target.value },
                            }))}
                          />
                        </div>
                        <div>
                          <label className="admin-label">Opening Hours</label>
                          <input
                            className="admin-input"
                            value={sectionForm.settings.openingHours}
                            onChange={(e) => setSectionForm((current) => ({
                              ...current,
                              settings: { ...current.settings, openingHours: e.target.value },
                            }))}
                          />
                        </div>
                      </div>

                      <label className="admin-label">Address</label>
                      <textarea
                        className="admin-input"
                        rows={3}
                        value={sectionForm.settings.address}
                        onChange={(e) => setSectionForm((current) => ({
                          ...current,
                          settings: { ...current.settings, address: e.target.value },
                        }))}
                      />

                      <div className="admin-form-2col">
                        {socialFields.map((field) => (
                          <div key={field.key}>
                            <label className="admin-label">{field.label}</label>
                            <input
                              className="admin-input"
                              value={sectionForm.settings[field.key]}
                              onChange={(e) => setSectionForm((current) => ({
                                ...current,
                                settings: { ...current.settings, [field.key]: e.target.value },
                              }))}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="admin-footer-links">
                        <div className="row-between">
                          <label className="admin-label">Footer Links</label>
                          <button type="button" className="admin-btn-secondary" onClick={addFooterLink}>
                            Add Link
                          </button>
                        </div>
                        {(sectionForm.settings.footerLinks || []).map((entry, index) => (
                          <div key={`footer-link-${index}`} className="admin-form-2col admin-footer-link-row">
                            <div>
                              <label className="admin-label">Label</label>
                              <input
                                className="admin-input"
                                value={entry.label}
                                onChange={(e) => updateFooterLink(index, "label", e.target.value)}
                              />
                            </div>
                            <div className="admin-footer-link-input">
                              <div>
                                <label className="admin-label">Link</label>
                                <input
                                  className="admin-input"
                                  value={entry.href}
                                  onChange={(e) => updateFooterLink(index, "href", e.target.value)}
                                />
                              </div>
                              <button
                                type="button"
                                className="admin-icon-btn danger"
                                onClick={() => removeFooterLink(index)}
                                aria-label="Remove footer link"
                              >
                                <i className="fa-solid fa-trash" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="admin-modal-actions">
                    <button type="button" className="admin-btn-primary" onClick={saveSection} disabled={savingSection}>
                      {savingSection ? "Saving..." : "Save Section"}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="admin-surface admin-homepage-items">
              <div className="admin-surface-head">
                <div className="row-between">
                  <div>
                    <h2 className="admin-surface-title">Section Items</h2>
                    <p className="admin-surface-subtitle">
                      Add, reorder, activate, and edit items shown inside this section.
                    </p>
                  </div>
                  {activeTab !== "footer" && (
                    <button type="button" className="admin-btn-primary" onClick={openCreateItem}>
                      <i className="fa-solid fa-plus" />
                      Add Item
                    </button>
                  )}
                </div>
              </div>

              {activeTab === "footer" ? (
                <div className="admin-empty-state">
                  <div className="admin-empty-icon"><i className="fa-solid fa-address-book" /></div>
                  <div className="admin-empty-title">Footer is managed from the section form</div>
                  <div className="admin-muted">Update contact details, social links, and footer navigation above.</div>
                </div>
              ) : currentSection.items.length === 0 ? (
                <div className="admin-empty-state">
                  <div className="admin-empty-icon"><i className="fa-solid fa-layer-group" /></div>
                  <div className="admin-empty-title">{currentSection.emptyTitle}</div>
                  <div className="admin-muted">{currentSection.emptyText}</div>
                </div>
              ) : (
                <div className="admin-homepage-item-grid">
                  {currentSection.items.map((item, index) => (
                    <article key={item.id} className="admin-homepage-item-card animate-fade-in">
                      <div className="admin-homepage-item-head">
                        <div>
                          <strong>{item.title || item.customerName}</strong>
                          <p>{renderItemCardMeta(activeTab, item)}</p>
                        </div>
                        <div className="admin-banner-status-row">
                          <span className={`badge ${item.isCurrentlyVisible ? "ready" : "pending"}`}>
                            {item.isCurrentlyVisible ? "Visible" : "Hidden"}
                          </span>
                          <span className={`badge ${item.isActive ? "role-admin" : "failed"}`}>
                            {item.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="admin-homepage-item-body">
                        {(item.imageUrl || item.customerImageUrl) ? (
                          <img src={item.imageUrl || item.customerImageUrl} alt={item.title || item.customerName} />
                        ) : (
                          <div className="admin-homepage-item-placeholder">
                            <i className={item.icon || "fa-solid fa-image"} />
                          </div>
                        )}

                        <div className="admin-homepage-item-actions">
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="admin-icon-btn"
                              onClick={() => moveItem(index, -1)}
                              disabled={reordering || index === 0}
                              aria-label="Move item up"
                            >
                              <i className="fa-solid fa-arrow-up" />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn"
                              onClick={() => moveItem(index, 1)}
                              disabled={reordering || index === currentSection.items.length - 1}
                              aria-label="Move item down"
                            >
                              <i className="fa-solid fa-arrow-down" />
                            </button>
                          </div>

                          <div className="admin-row-actions">
                            <button type="button" className="admin-icon-btn" onClick={() => openEditItem(item)} aria-label="Edit item">
                              <i className="fa-solid fa-pen" />
                            </button>
                            <button type="button" className="admin-icon-btn" onClick={() => toggleItem(item)} aria-label="Toggle item">
                              <i className={`fa-solid ${item.isActive ? "fa-eye" : "fa-eye-slash"}`} />
                            </button>
                            <button type="button" className="admin-icon-btn danger" onClick={() => deleteItem(item)} aria-label="Delete item">
                              <i className="fa-solid fa-trash" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
          {itemModalOpen && (
            <div className="admin-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeItemModal()}>
              <div className="admin-modal admin-modal-lg animate-scale-up" role="dialog" aria-modal="true">
                <div className="admin-modal-head row-between">
                  <h3 className="admin-modal-title">
                    {editingItem ? `Edit ${currentDefinition?.label} Item` : `Add ${currentDefinition?.label} Item`}
                  </h3>
                  <button type="button" className="admin-icon-btn" onClick={closeItemModal} aria-label="Close">
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>

                {formError && <div className="admin-alert admin-form-alert">{formError}</div>}

                <form className="admin-form-grid" onSubmit={onSubmitItem}>
                  <div className="admin-form-col">
                    {activeTab !== "testimonials" && (
                      <>
                        <label className="admin-label">
                          {activeTab === "categories" ? "Category Name" : activeTab === "special-offers" ? "Offer Title" : "Title"}
                        </label>
                        <input
                          className="admin-input"
                          value={itemForm.title}
                          onChange={(e) => setItemForm((current) => ({ ...current, title: e.target.value }))}
                        />
                      </>
                    )}

                    {activeTab === "testimonials" && (
                      <>
                        <label className="admin-label">Customer Name</label>
                        <input
                          className="admin-input"
                          value={itemForm.customerName}
                          onChange={(e) => setItemForm((current) => ({ ...current, customerName: e.target.value }))}
                        />
                      </>
                    )}

                    <label className="admin-label">
                      {activeTab === "special-offers" ? "Short Description" : "Description"}
                    </label>
                    <textarea
                      className="admin-input"
                      rows={4}
                      value={itemForm.description}
                      onChange={(e) => setItemForm((current) => ({ ...current, description: e.target.value }))}
                    />

                    {(activeTab === "categories" || activeTab === "why-choose-us") && (
                      <div className="admin-form-2col">
                        <div>
                          <label className="admin-label">Image URL</label>
                          <input
                            className="admin-input"
                            value={itemForm.imageUrl}
                            onChange={(e) => setItemForm((current) => ({ ...current, imageUrl: e.target.value }))}
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="admin-label">Icon Class</label>
                          <input
                            className="admin-input"
                            value={itemForm.icon}
                            onChange={(e) => setItemForm((current) => ({ ...current, icon: e.target.value }))}
                            placeholder="fa-solid fa-fire"
                          />
                        </div>
                      </div>
                    )}

                    {activeTab !== "categories" && activeTab !== "why-choose-us" && activeTab !== "testimonials" && (
                      <>
                        <label className="admin-label">Image URL</label>
                        <input
                          className="admin-input"
                          value={itemForm.imageUrl}
                          onChange={(e) => setItemForm((current) => ({ ...current, imageUrl: e.target.value }))}
                          placeholder="https://..."
                        />
                      </>
                    )}

                    {activeTab === "categories" && (
                      <>
                        <label className="admin-label">Short Label / Count</label>
                        <input
                          className="admin-input"
                          value={itemForm.labelText}
                          onChange={(e) => setItemForm((current) => ({ ...current, labelText: e.target.value }))}
                          placeholder="12 items"
                        />
                      </>
                    )}

                    {activeTab === "featured-foods" && (
                      <>
                        <div className="admin-form-2col">
                          <div>
                            <label className="admin-label">Category</label>
                            <input
                              className="admin-input"
                              value={itemForm.category}
                              onChange={(e) => setItemForm((current) => ({ ...current, category: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="admin-label">Availability</label>
                            <select
                              className="admin-select admin-input"
                              value={itemForm.availabilityStatus}
                              onChange={(e) => setItemForm((current) => ({ ...current, availabilityStatus: e.target.value }))}
                            >
                              <option value="available">Available</option>
                              <option value="unavailable">Unavailable</option>
                              <option value="out_of_stock">Out of stock</option>
                            </select>
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
                              value={itemForm.originalPrice}
                              onChange={(e) => setItemForm((current) => ({ ...current, originalPrice: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="admin-label">Discount Type</label>
                            <select
                              className="admin-select admin-input"
                              value={itemForm.discountType}
                              onChange={(e) => setItemForm((current) => ({
                                ...current,
                                discountType: e.target.value,
                                discountValue: e.target.value === "none" ? "" : current.discountValue,
                              }))}
                            >
                              <option value="none">No discount</option>
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed amount</option>
                            </select>
                          </div>
                        </div>

                        <div className="admin-form-2col">
                          <div>
                            <label className="admin-label">Discount Value</label>
                            <input
                              className="admin-input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={itemForm.discountType === "none" ? "" : itemForm.discountValue}
                              onChange={(e) => setItemForm((current) => ({ ...current, discountValue: e.target.value }))}
                              disabled={itemForm.discountType === "none"}
                            />
                          </div>
                          <div>
                            <label className="admin-label">CTA Text</label>
                            <input
                              className="admin-input"
                              value={itemForm.buttonText}
                              onChange={(e) => setItemForm((current) => ({ ...current, buttonText: e.target.value }))}
                            />
                          </div>
                        </div>

                        <label className="admin-label">CTA Link</label>
                        <input
                          className="admin-input"
                          value={itemForm.buttonLink}
                          onChange={(e) => setItemForm((current) => ({ ...current, buttonLink: e.target.value }))}
                        />
                      </>
                    )}

                    {activeTab === "special-offers" && (
                      <>
                        <div className="admin-form-2col">
                          <div>
                            <label className="admin-label">Discount Type</label>
                            <select
                              className="admin-select admin-input"
                              value={itemForm.discountType}
                              onChange={(e) => setItemForm((current) => ({ ...current, discountType: e.target.value }))}
                            >
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
                              value={itemForm.discountValue}
                              onChange={(e) => setItemForm((current) => ({ ...current, discountValue: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="admin-form-2col">
                          <div>
                            <label className="admin-label">Start Date</label>
                            <input
                              className="admin-input"
                              type="date"
                              value={itemForm.startDate}
                              onChange={(e) => setItemForm((current) => ({ ...current, startDate: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="admin-label">End Date</label>
                            <input
                              className="admin-input"
                              type="date"
                              value={itemForm.endDate}
                              onChange={(e) => setItemForm((current) => ({ ...current, endDate: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="admin-form-2col">
                          <div>
                            <label className="admin-label">CTA Text</label>
                            <input
                              className="admin-input"
                              value={itemForm.buttonText}
                              onChange={(e) => setItemForm((current) => ({ ...current, buttonText: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="admin-label">CTA Link</label>
                            <input
                              className="admin-input"
                              value={itemForm.buttonLink}
                              onChange={(e) => setItemForm((current) => ({ ...current, buttonLink: e.target.value }))}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === "best-sellers" && (
                      <>
                        <div className="admin-form-2col">
                          <div>
                            <label className="admin-label">Price</label>
                            <input
                              className="admin-input"
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={itemForm.originalPrice}
                              onChange={(e) => setItemForm((current) => ({ ...current, originalPrice: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="admin-label">Badge Text</label>
                            <input
                              className="admin-input"
                              value={itemForm.badgeText}
                              onChange={(e) => setItemForm((current) => ({ ...current, badgeText: e.target.value }))}
                              placeholder="Chef Pick"
                            />
                          </div>
                        </div>

                        <div className="admin-form-2col">
                          <div>
                            <label className="admin-label">CTA Text</label>
                            <input
                              className="admin-input"
                              value={itemForm.buttonText}
                              onChange={(e) => setItemForm((current) => ({ ...current, buttonText: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="admin-label">CTA Link</label>
                            <input
                              className="admin-input"
                              value={itemForm.buttonLink}
                              onChange={(e) => setItemForm((current) => ({ ...current, buttonLink: e.target.value }))}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === "testimonials" && (
                      <>
                        <label className="admin-label">Customer Image URL</label>
                        <input
                          className="admin-input"
                          value={itemForm.customerImageUrl}
                          onChange={(e) => setItemForm((current) => ({ ...current, customerImageUrl: e.target.value }))}
                          placeholder="https://..."
                        />

                        <label className="admin-label">Star Rating</label>
                        <input
                          className="admin-input"
                          type="number"
                          min="1"
                          max="5"
                          value={itemForm.rating}
                          onChange={(e) => setItemForm((current) => ({ ...current, rating: e.target.value }))}
                        />
                      </>
                    )}

                    <div className="admin-form-2col">
                      <div>
                        <label className="admin-label">Sort Order</label>
                        <input
                          className="admin-input"
                          type="number"
                          value={itemForm.displayOrder}
                          onChange={(e) => setItemForm((current) => ({ ...current, displayOrder: e.target.value }))}
                        />
                      </div>
                      <div className="admin-form-row admin-form-row-tight">
                        <div>
                          <div className="admin-label" style={{ marginBottom: 2 }}>Active</div>
                          <div className="admin-muted">Only active items can appear on the homepage.</div>
                        </div>
                        <button
                          type="button"
                          className={`admin-switch${itemForm.isActive ? " checked" : ""}`}
                          onClick={() => setItemForm((current) => ({ ...current, isActive: !current.isActive }))}
                          aria-pressed={itemForm.isActive}
                        >
                          <span className="admin-switch-thumb" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="admin-form-col">
                    <ItemPreview sectionKey={activeTab} form={itemPreview} />
                  </div>

                  <div className="admin-modal-actions admin-modal-actions-span">
                    <button type="button" className="admin-btn-secondary" onClick={closeItemModal} disabled={savingItem}>
                      Cancel
                    </button>
                    <button type="submit" className="admin-btn-primary" disabled={savingItem}>
                      {savingItem ? "Saving..." : editingItem ? "Save Item" : "Create Item"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminHomepageManagementPage;

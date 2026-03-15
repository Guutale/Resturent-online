import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../../lib/api";
import AuthBrandShowcase from "../../components/AuthBrandShowcase";
import {
  AUTH_BRANDING_PAGE_TYPES,
  buildAuthBrandingPayload,
  createAuthBrandingForm,
  getAuthBrandingPageMeta,
  normalizeAuthBrandingCollection,
  optimizeAuthBrandingImage,
  resolvePreviewAuthBranding,
  toAuthBrandingForm,
  validateAuthBrandingForm,
} from "../../lib/authBranding";

const formatUpdatedAt = (value) => {
  if (!value) return "Not saved yet";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not saved yet";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const AdminAuthBrandingPage = () => {
  const [content, setContent] = useState({ items: [], itemsByPageType: {} });
  const [activeTab, setActiveTab] = useState("login");
  const [form, setForm] = useState(createAuthBrandingForm("login"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/auth-branding/admin");
      setContent(normalizeAuthBrandingCollection(data));
      setError("");
    } catch (err) {
      setContent({ items: [], itemsByPageType: {} });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setFormError("");
    setForm(toAuthBrandingForm(activeTab, content.itemsByPageType[activeTab]));
  }, [activeTab, content]);

  const currentItem = content.itemsByPageType[activeTab];
  const activeCount = useMemo(
    () => AUTH_BRANDING_PAGE_TYPES.filter((pageType) => content.itemsByPageType[pageType]?.isActive).length,
    [content]
  );
  const previewBranding = useMemo(
    () => resolvePreviewAuthBranding({ ...buildAuthBrandingPayload(form), isActive: form.isActive }, activeTab),
    [activeTab, form]
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateAuthBrandingForm(form);
    if (validationErrors.length) {
      setFormError(validationErrors[0]);
      return;
    }

    setSaving(true);
    setError("");
    setFormError("");

    try {
      await apiRequest(`/auth-branding/${activeTab}`, {
        method: "PATCH",
        body: JSON.stringify(buildAuthBrandingPayload(form)),
      });
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFormError("");

    try {
      const imageUrl = await optimizeAuthBrandingImage(file);
      setForm((current) => ({ ...current, imageUrl }));
    } catch (err) {
      setFormError(err.message);
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Authentication Branding</h1>
          <p className="admin-subtitle">
            Control the premium split-layout visuals and copy used on the login and registration pages.
          </p>
        </div>

        <div className="admin-actions">
          <div className="admin-segment">
            <button type="button" className="admin-segment-btn active">
              {activeCount} active
            </button>
            <button type="button" className="admin-segment-btn">
              {AUTH_BRANDING_PAGE_TYPES.length} managed pages
            </button>
          </div>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-auth-summary-grid">
        {AUTH_BRANDING_PAGE_TYPES.map((pageType) => {
          const meta = getAuthBrandingPageMeta(pageType);
          const item = content.itemsByPageType[pageType];
          const status = item?.isActive ? "Active" : "Fallback mode";

          return (
            <button
              key={pageType}
              type="button"
              className={`admin-auth-summary-card ${activeTab === pageType ? "active" : ""}`}
              onClick={() => setActiveTab(pageType)}
            >
              <div className="admin-auth-summary-head">
                <div>
                  <strong>{meta.label}</strong>
                  <span>{status}</span>
                </div>
                <span className={`badge ${item?.isActive ? "ready" : "pending"}`}>{status}</span>
              </div>
              <p>{item?.heading || "No custom branding saved yet."}</p>
              <small>Updated {formatUpdatedAt(item?.updatedAt)}</small>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon"><i className="fa-solid fa-spinner" /></div>
          <div className="admin-empty-title">Loading authentication branding...</div>
        </div>
      ) : (
        <div className="admin-auth-layout">
          <section className="admin-surface">
            <div className="admin-surface-head">
              <h2 className="admin-surface-title">{getAuthBrandingPageMeta(activeTab).label}</h2>
              <p className="admin-surface-subtitle">
                Upload or replace the image, edit copy, adjust overlay strength, and control whether this branding is active.
              </p>
            </div>

            {formError && <div className="admin-alert admin-form-alert">{formError}</div>}

            <form className="admin-form-grid admin-auth-form-grid" onSubmit={onSubmit}>
              <div className="admin-form-col">
                <label className="admin-label">Promo Text</label>
                <input
                  className="admin-input"
                  maxLength={40}
                  value={form.promoText}
                  onChange={(event) => setForm((current) => ({ ...current, promoText: event.target.value }))}
                  placeholder="Chef's table access"
                />

                <label className="admin-label">Heading</label>
                <input
                  className="admin-input"
                  maxLength={120}
                  value={form.heading}
                  onChange={(event) => setForm((current) => ({ ...current, heading: event.target.value }))}
                  placeholder="Return to Flavor Point without losing the rhythm."
                />

                <label className="admin-label">Subheading</label>
                <textarea
                  className="admin-input"
                  rows={3}
                  maxLength={180}
                  value={form.subheading}
                  onChange={(event) => setForm((current) => ({ ...current, subheading: event.target.value }))}
                  placeholder="Short secondary line for the visual panel."
                />

                <label className="admin-label">Description</label>
                <textarea
                  className="admin-input"
                  rows={4}
                  maxLength={240}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Optional promotional text that sits under the heading."
                />

                <div className="admin-form-2col">
                  <div>
                    <label className="admin-label">CTA Text</label>
                    <input
                      className="admin-input"
                      maxLength={40}
                      value={form.ctaText}
                      onChange={(event) => setForm((current) => ({ ...current, ctaText: event.target.value }))}
                      placeholder="Browse menu"
                    />
                  </div>
                  <div>
                    <label className="admin-label">CTA Link</label>
                    <input
                      className="admin-input"
                      value={form.ctaLink}
                      onChange={(event) => setForm((current) => ({ ...current, ctaLink: event.target.value }))}
                      placeholder="/menu"
                    />
                  </div>
                </div>

                <div className="admin-form-2col">
                  <div>
                    <label className="admin-label">Text Alignment</label>
                    <select
                      className="admin-select admin-input"
                      value={form.textAlignment}
                      onChange={(event) => setForm((current) => ({ ...current, textAlignment: event.target.value }))}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">Overlay Opacity</label>
                    <div className="admin-auth-slider-row">
                      <input
                        type="range"
                        min="0.12"
                        max="0.88"
                        step="0.02"
                        value={form.overlayOpacity}
                        onChange={(event) => setForm((current) => ({ ...current, overlayOpacity: event.target.value }))}
                      />
                      <strong>{Number(form.overlayOpacity).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                <div className="admin-form-row">
                  <div>
                    <div className="admin-label" style={{ marginBottom: 2 }}>Active</div>
                    <div className="admin-muted">
                      Only active branding appears on the related public authentication page.
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`admin-switch${form.isActive ? " checked" : ""}`}
                    onClick={() => setForm((current) => ({ ...current, isActive: !current.isActive }))}
                    aria-pressed={form.isActive}
                  >
                    <span className="admin-switch-thumb" />
                  </button>
                </div>

                <div className="admin-auth-meta-row">
                  <span className="badge">{currentItem?._id ? "Saved" : "New draft"}</span>
                  <span className="admin-muted">Last updated: {formatUpdatedAt(currentItem?.updatedAt)}</span>
                </div>
              </div>

              <div className="admin-form-col">
                <div className="admin-upload">
                  <div className="admin-upload-preview">
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="Authentication branding preview" />
                    ) : (
                      <div className="admin-auth-upload-empty">
                        <i className="fa-regular fa-image" />
                      </div>
                    )}
                  </div>
                  <div className="admin-upload-body">
                    <div className="admin-upload-title">Banner Image</div>
                    <div className="admin-muted">
                      Upload a local file or paste an image URL. Uploads are optimized automatically before saving.
                    </div>

                    <div className="admin-inline" style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? "Optimizing..." : form.imageUrl ? "Replace Image" : "Upload Image"}
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        onClick={() => setForm((current) => ({ ...current, imageUrl: "" }))}
                        disabled={!form.imageUrl}
                      >
                        Remove Image
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      hidden
                    />

                    <label className="admin-label">Or use an image URL</label>
                    <input
                      className="admin-input"
                      value={form.imageUrl}
                      onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="admin-modal-actions admin-auth-actions">
                  <button type="submit" className="admin-btn-primary" disabled={saving || uploading}>
                    {saving ? "Saving..." : "Save Branding"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <aside className="admin-surface">
            <div className="admin-surface-head">
              <h2 className="admin-surface-title">Live Preview</h2>
              <p className="admin-surface-subtitle">
                Review the visual block before saving. Inactive settings fall back to the default public experience.
              </p>
            </div>

            <div className="admin-auth-preview-shell">
              <AuthBrandShowcase
                branding={previewBranding}
                pageType={activeTab}
                highlights={getAuthBrandingPageMeta(activeTab).defaultHighlights}
                compact
                statusLabel={form.isActive ? "Active preview" : "Inactive preview"}
              />

              <div className="admin-auth-form-preview">
                <span className="admin-auth-form-preview-kicker">Form preview</span>
                <h3>{activeTab === "login" ? "Sign in to continue" : "Create your account"}</h3>
                <div className="admin-auth-form-preview-fields">
                  <span />
                  <span />
                  <span />
                  {activeTab === "register" && <span />}
                </div>
                <div className="admin-auth-form-preview-button" />
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default AdminAuthBrandingPage;

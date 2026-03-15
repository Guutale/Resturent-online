import React from "react";
import { Link } from "react-router-dom";
import { getAuthBrandingPageMeta } from "../lib/authBranding";

const isExternalLink = (value) => /^(https?:\/\/|mailto:|tel:)/i.test(String(value || "").trim());

const ShowcaseActionLink = ({ className, to, children }) => {
  if (!to) return null;

  if (isExternalLink(to)) {
    return (
      <a className={className} href={to} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link className={className} to={to}>
      {children}
    </Link>
  );
};

const AuthBrandShowcase = ({
  branding,
  pageType,
  highlights = [],
  compact = false,
  statusLabel = "",
}) => {
  const meta = getAuthBrandingPageMeta(pageType);
  const alignmentClass = `align-${branding.textAlignment || "left"}`;
  const wrapperClass = [
    "auth-brand-panel",
    compact ? "is-compact" : "",
    alignmentClass,
    branding.hasCustomImage ? "has-image" : "is-fallback",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={wrapperClass}
      style={{ "--auth-overlay-opacity": branding.overlayOpacity }}
    >
      <div
        className="auth-brand-media"
        style={branding.imageUrl ? { backgroundImage: `url(${branding.imageUrl})` } : undefined}
        aria-hidden="true"
      />
      <div className="auth-brand-overlay" aria-hidden="true" />
      <div className="auth-brand-pattern" aria-hidden="true" />

      <div className="auth-brand-inner">
        <div className="auth-brand-meta-row">
          <span className="auth-brand-page-label">{meta.heroLabel}</span>
          {statusLabel && (
            <span className={`auth-brand-status ${branding.isActive ? "is-active" : "is-inactive"}`}>
              {statusLabel}
            </span>
          )}
        </div>

        {branding.promoText && <span className="auth-brand-pill">{branding.promoText}</span>}

        <div className="auth-brand-copy">
          <h1>{branding.heading}</h1>
          {branding.subheading && <p className="auth-brand-subheading">{branding.subheading}</p>}
          {branding.description && <p className="auth-brand-description">{branding.description}</p>}
        </div>

        {branding.ctaText && branding.ctaLink && (
          <ShowcaseActionLink className="auth-brand-cta" to={branding.ctaLink}>
            {branding.ctaText}
            <i className="fa-solid fa-arrow-right" />
          </ShowcaseActionLink>
        )}

        {highlights.length > 0 && (
          <div className="auth-brand-highlight-grid">
            {highlights.map((item) => (
              <div key={`${item.title}-${item.icon}`} className="auth-brand-highlight-card">
                <span className="auth-brand-highlight-icon">
                  <i className={item.icon} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

export default AuthBrandShowcase;

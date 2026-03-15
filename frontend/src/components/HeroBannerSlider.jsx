import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { normalizeHeroSlide } from "../lib/heroSlides";

const isExternalAction = (value) => /^(https?:\/\/|mailto:|tel:)/i.test(String(value || "").trim());

const HeroActionLink = ({ className, to, children }) => {
  if (!to) return null;

  if (isExternalAction(to)) {
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

const formatReadableDate = (value) => {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
};

const formatScheduleLabel = (slide) => {
  if (slide.startDate && slide.endDate) return `${formatReadableDate(slide.startDate)} to ${formatReadableDate(slide.endDate)}`;
  if (slide.startDate) return `Starts ${formatReadableDate(slide.startDate)}`;
  if (slide.endDate) return `Until ${formatReadableDate(slide.endDate)}`;
  return "Available today";
};

const HeroBannerSlider = ({ slides = [], loading = false }) => {
  const normalizedSlides = useMemo(
    () => slides.map((slide) => normalizeHeroSlide(slide)).filter((slide) => slide.isCurrentlyVisible),
    [slides]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex > normalizedSlides.length - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, normalizedSlides.length]);

  useEffect(() => {
    if (normalizedSlides.length <= 1) return undefined;

    const delay = normalizedSlides[activeIndex]?.autoplaySeconds * 1000 || 5000;
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % normalizedSlides.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [activeIndex, normalizedSlides]);

  if (loading) {
    return (
      <section id="home" className="hero-slider-section hero-slider-state mx-auto is-loading" aria-busy="true">
        <div className="hero-slider-shell">
          <div className="hero-slider-main hero-slider-skeleton">
            <span className="hero-slider-skeleton-pill" />
            <span className="hero-slider-skeleton-badge" />
            <span className="hero-slider-skeleton-title" />
            <span className="hero-slider-skeleton-title short" />
            <span className="hero-slider-skeleton-copy" />
            <span className="hero-slider-skeleton-copy short" />
            <div className="hero-slider-skeleton-price" />
            <div className="hero-slider-skeleton-actions">
              <span className="hero-slider-skeleton-btn" />
              <span className="hero-slider-skeleton-btn ghost" />
            </div>
          </div>

          <aside className="hero-slider-side hero-slider-side-loading">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`hero-skeleton-${index}`} className="hero-slider-preview-card is-skeleton" aria-hidden="true">
                <span className="hero-slider-preview-thumb-skeleton" />
                <div className="hero-slider-preview-copy">
                  <span className="hero-slider-preview-line" />
                  <span className="hero-slider-preview-line wide" />
                  <span className="hero-slider-preview-line short" />
                </div>
              </div>
            ))}
          </aside>
        </div>
      </section>
    );
  }

  if (normalizedSlides.length === 0) {
    return (
      <section id="home" className="hero-slider-section hero-slider-state mx-auto">
        <div className="hero-slider-backdrop hero-slider-empty-backdrop" aria-hidden="true" />
        <div className="hero-slider-shade" />
        <div className="hero-slider-shell hero-slider-shell-empty">
          <div className="hero-slider-main">
            <p className="hero-slider-overline">Signature dining moments</p>
            <div className="hero-slider-meta">
              <span className="hero-slider-category">Hero promotion</span>
            </div>
            <h1>Fresh stories from the kitchen arrive soon</h1>
            <p>
              Browse the menu to discover chef-led dishes, seasonal plates, and warm dining favorites available today.
            </p>
            <div className="hero-slider-actions">
              <Link className="btn" to="/menu">
                Browse Menu
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const activeSlide = normalizedSlides[activeIndex];
  const previewSlides = Array.from(
    { length: Math.max(0, Math.min(3, normalizedSlides.length - 1)) },
    (_, offset) => {
      const index = (activeIndex + offset + 1) % normalizedSlides.length;
      return { index, slide: normalizedSlides[index] };
    }
  );
  const hasMultipleSlides = normalizedSlides.length > 1;
  const hasPreviewSlides = previewSlides.length > 0;
  const scheduleLabel = formatScheduleLabel(activeSlide);

  const goTo = (index) => setActiveIndex(index);
  const goPrev = () => setActiveIndex((current) => (current - 1 + normalizedSlides.length) % normalizedSlides.length);
  const goNext = () => setActiveIndex((current) => (current + 1) % normalizedSlides.length);

  return (
    <section id="home" className="hero-slider-section mx-auto">
      <div
        className="hero-slider-backdrop"
        style={{ backgroundImage: `url(${activeSlide.imageUrl})` }}
        aria-hidden="true"
      />
      <div className="hero-slider-shade" />

      <div className="hero-slider-shell">
        <div className="hero-slider-main" aria-live="polite">
          <p className="hero-slider-overline">Signature dining moments</p>

          <div className="hero-slider-meta">
            <span className="hero-slider-category">{activeSlide.category}</span>
            {activeSlide.discountBadge && (
              <span className="hero-slider-discount">{activeSlide.discountBadge}</span>
            )}
          </div>

          <h1>{activeSlide.title}</h1>
          <p>{activeSlide.description || "Premium dishes and homepage offers, scheduled directly from the dashboard."}</p>

          <div className="hero-slider-pricing">
            {activeSlide.hasDiscount && (
              <span className="hero-slider-original-price">${activeSlide.originalPrice.toFixed(2)}</span>
            )}
            <strong>${activeSlide.finalPrice.toFixed(2)}</strong>
          </div>

          <div className="hero-slider-storyline">
            <span className="hero-slider-note">
              <i className="fa-regular fa-calendar" />
              {scheduleLabel}
            </span>
            <span className="hero-slider-note">
              <i className="fa-solid fa-bell-concierge" />
              Order online in minutes
            </span>
          </div>

          <div className="hero-slider-actions">
            {activeSlide.buttonText && activeSlide.buttonLink && (
              <HeroActionLink className="btn" to={activeSlide.buttonLink}>
                {activeSlide.buttonText}
                <i className="fa-solid fa-arrow-right" />
              </HeroActionLink>
            )}
            <Link className="btn-outline" to="/menu">Browse Menu</Link>
          </div>

          {hasMultipleSlides && (
            <div className="hero-slider-footer">
              <div className="hero-slider-control-group">
                <button type="button" className="hero-slider-arrow" onClick={goPrev} aria-label="Previous slide">
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <button type="button" className="hero-slider-arrow" onClick={goNext} aria-label="Next slide">
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>

              <div className="hero-slider-dots" aria-label="Slider pagination">
                {normalizedSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={`hero-slider-dot ${index === activeIndex ? "is-active" : ""}`}
                    onClick={() => goTo(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={index === activeIndex ? "true" : "false"}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="hero-slider-side">
          <div className="hero-slider-side-head">
            <div className="hero-slider-side-copy">
              <span className="hero-slider-side-label">Featured deals</span>
              <small>Seasonal stories, signature plates, and standout offers worth opening next.</small>
            </div>
            <strong>{String(activeIndex + 1).padStart(2, "0")} / {String(normalizedSlides.length).padStart(2, "0")}</strong>
          </div>

          {hasPreviewSlides ? (
            <div className="hero-slider-preview-list">
              {previewSlides.map(({ index, slide }) => (
                <button
                  key={slide.id}
                  type="button"
                  className="hero-slider-preview-card"
                  onClick={() => goTo(index)}
                  aria-label={`Show ${slide.title}`}
                >
                  <img src={slide.imageUrl} alt={slide.title} />
                  <div className="hero-slider-preview-copy">
                    <span>{slide.category}</span>
                    <strong>{slide.title}</strong>
                    <small>{slide.discountBadge || `$${slide.finalPrice.toFixed(2)}`}</small>
                  </div>
                  <span className="hero-slider-preview-arrow" aria-hidden="true">
                    <i className="fa-solid fa-arrow-right" />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="hero-slider-side-empty">
              <span className="hero-slider-side-label">Single spotlight</span>
              <strong>Tonight&apos;s signature feature stays focused here.</strong>
              <p>Keep this offer front and center while the rest of the menu remains one tap away.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

export default HeroBannerSlider;

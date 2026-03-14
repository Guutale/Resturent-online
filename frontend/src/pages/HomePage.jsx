import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HeroBannerSlider from "../components/HeroBannerSlider";
import { apiRequest } from "../lib/api";
import { normalizeHeroSlide } from "../lib/heroSlides";

const fallbackCategories = [
  {
    _id: "flame-grill",
    name: "Flame Grill",
    slug: "",
    imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200",
  },
  {
    _id: "signature-bowls",
    name: "Signature Bowls",
    slug: "",
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1200",
  },
  {
    _id: "fresh-bakes",
    name: "Fresh Bakes",
    slug: "",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200",
  },
  {
    _id: "chef-specials",
    name: "Chef Specials",
    slug: "",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200",
  },
];

const servicePillars = [
  {
    icon: "fa-layer-group",
    title: "Admin-controlled promotions",
    text: "Featured banners, offers, stock status, and autoplay timing stay editable from the dashboard.",
  },
  {
    icon: "fa-mobile-screen-button",
    title: "Responsive by default",
    text: "The homepage hero, navbar, and offer cards stay premium on mobile, tablet, and desktop.",
  },
  {
    icon: "fa-bag-shopping",
    title: "Offer-first ordering",
    text: "Homepage banners can promote discount meals and regular menu items without hardcoded content.",
  },
  {
    icon: "fa-heart-circle-check",
    title: "Built for repeat visits",
    text: "Priority sorting and scheduled promotions keep the homepage current instead of static.",
  },
];

const orderSteps = [
  {
    step: "01",
    title: "Promote",
    text: "Admin or HR publishes a banner with pricing, timing, availability, and CTA configuration.",
  },
  {
    step: "02",
    title: "Display",
    text: "Only active, available, and in-date food items appear in the homepage hero automatically.",
  },
  {
    step: "03",
    title: "Order",
    text: "Customers move directly from the banner CTA into the menu or the linked offer route.",
  },
  {
    step: "04",
    title: "Refresh",
    text: "Expired or unavailable deals disappear without homepage code changes or manual cleanup.",
  },
];

const isExternalAction = (value) => /^(https?:\/\/|mailto:|tel:)/i.test(String(value || "").trim());

const OfferActionLink = ({ className, to, children }) => {
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

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [heroLoading, setHeroLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    apiRequest("/categories")
      .then((data) => {
        if (isMounted) {
          setCategories(data.items || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCategories([]);
        }
      });

    apiRequest("/hero-slides")
      .then((data) => {
        if (isMounted) {
          setHeroSlides((data.items || []).map(normalizeHeroSlide));
        }
      })
      .catch(() => {
        if (isMounted) {
          setHeroSlides([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setHeroLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredCategories = (categories.length ? categories : fallbackCategories).slice(0, 4);
  const featuredOffers = heroSlides.slice(0, 4);

  const heroStats = useMemo(() => ([
    { value: heroLoading ? "--" : `${heroSlides.length}`, label: "active promo banners" },
    { value: `${Math.max(categories.length, 8)}+`, label: "curated categories" },
    { value: "30 min", label: "average delivery" },
  ]), [categories.length, heroLoading, heroSlides.length]);

  return (
    <div className="page home-page">
      <HeroBannerSlider slides={heroSlides} loading={heroLoading} />

      <section className="home-section offer-section" id="offers">
        <div className="section-head">
          <div>
            <p className="section-kicker">Discount spotlight</p>
            <h2 className="section-display">Homepage offers worth clicking immediately</h2>
          </div>

          <Link className="text-link" to="/menu">
            See full menu
            <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>

        <div className="hero-metrics">
          {heroStats.map((stat) => (
            <div className="metric-card" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="offer-grid">
          {heroLoading && Array.from({ length: 4 }).map((_, index) => (
            <article key={`offer-skeleton-${index}`} className="offer-card is-loading" aria-hidden="true">
              <div className="offer-card-media offer-card-media-skeleton" />
              <div className="offer-card-body">
                <span className="offer-line-skeleton short" />
                <span className="offer-line-skeleton wide" />
                <span className="offer-line-skeleton" />
                <span className="offer-line-skeleton price" />
              </div>
            </article>
          ))}

          {!heroLoading && featuredOffers.map((slide) => (
            <article key={slide.id} className="offer-card">
              <div className="offer-card-media">
                <img src={slide.imageUrl} alt={slide.title} />
                <div className="offer-card-overlay" />
                {slide.discountBadge && <span className="offer-card-badge">{slide.discountBadge}</span>}
              </div>

              <div className="offer-card-body">
                <div className="offer-card-head">
                  <span className="section-kicker">{slide.category}</span>
                  <h3>{slide.title}</h3>
                </div>
                <p className="muted offer-card-description">
                  {slide.description || "Fresh restaurant promotion managed directly from the dashboard."}
                </p>

                <div className="offer-card-pricing">
                  {slide.hasDiscount && (
                    <span className="hero-slider-original-price">${slide.originalPrice.toFixed(2)}</span>
                  )}
                  <strong>${slide.finalPrice.toFixed(2)}</strong>
                </div>

                {slide.buttonText && slide.buttonLink && (
                  <OfferActionLink className="btn-ghost" to={slide.buttonLink}>
                    {slide.buttonText}
                  </OfferActionLink>
                )}
              </div>
            </article>
          ))}

          {!heroLoading && featuredOffers.length === 0 && (
            <div className="offer-empty-state">
              <div className="admin-empty-icon"><i className="fa-solid fa-utensils" /></div>
              <div className="admin-empty-title">No active hero offers</div>
              <div className="admin-muted">
                Publish an active, available banner from the dashboard to populate this section.
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <div>
            <p className="section-kicker">Start with the menu structure</p>
            <h2 className="section-display">Popular categories</h2>
          </div>

          <Link className="text-link" to="/menu">
            See full menu
            <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>

        <div className="category-grid">
          {featuredCategories.map((category, index) => (
            <Link
              className="category-card"
              key={category._id || category.slug || category.name}
              to={category.slug ? `/menu?category=${category.slug}` : "/menu"}
            >
              <div className="category-media">
                <img
                  src={category.imageUrl || "https://images.unsplash.com/photo-1543353071-10c8ba85a904?w=1200"}
                  alt={category.name}
                />
                <span className="category-index">{String(index + 1).padStart(2, "0")}</span>
              </div>

              <div className="category-body">
                <div className="category-title-row">
                  <strong>{category.name}</strong>
                  <span className="status-chip">Explore</span>
                </div>
                <p className="muted">Fresh picks curated around {category.name.toLowerCase()}.</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-story-grid" id="about">
        <article className="story-card story-card-dark">
          <p className="section-kicker">What the homepage should do</p>
          <h2>Look like a premium promo platform before the customer even scrolls.</h2>
          <p>
            The first screen now behaves like a campaign surface: dark cinematic visuals, clear pricing,
            and direct CTAs into the menu.
          </p>

          <div className="story-point-list">
            <div className="story-point">
              <i className="fa-solid fa-circle-check" />
              <span>Navbar and hero share the same dark, premium design system.</span>
            </div>
            <div className="story-point">
              <i className="fa-solid fa-circle-check" />
              <span>Promotions are dynamic and follow admin-managed priority, status, and schedule rules.</span>
            </div>
            <div className="story-point">
              <i className="fa-solid fa-circle-check" />
              <span>Discount badges only appear when a real discount exists, while normal food items stay supported.</span>
            </div>
          </div>
        </article>

        <div className="service-grid">
          {servicePillars.map((pillar) => (
            <article className="service-card" key={pillar.title}>
              <span className="service-icon">
                <i className={`fa-solid ${pillar.icon}`} />
              </span>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <div>
            <p className="section-kicker">How the homepage funnel works</p>
            <h2 className="section-display">From promotional banner to completed order in four steps</h2>
          </div>
        </div>

        <div className="timeline-grid">
          {orderSteps.map((step) => (
            <article className="timeline-card" key={step.step}>
              <span className="timeline-step">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="hospitality-banner">
        <div>
          <p className="section-kicker">Built for consistency</p>
          <h2>A homepage that can sell the promotion, not just decorate the brand.</h2>
        </div>

        <div className="hospitality-points">
          <div className="hospitality-point">
            <i className="fa-solid fa-check" />
            Dynamic promo slider
          </div>
          <div className="hospitality-point">
            <i className="fa-solid fa-check" />
            Admin-managed discounts
          </div>
          <div className="hospitality-point">
            <i className="fa-solid fa-check" />
            Scheduled visibility rules
          </div>
          <div className="hospitality-point">
            <i className="fa-solid fa-check" />
            Better mobile hierarchy
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

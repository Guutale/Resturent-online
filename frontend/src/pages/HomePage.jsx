import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

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

const heroPreviewItems = [
  { name: "Grilled saffron platter", note: "Smoky chicken, herb rice, warm sauce", price: "$18" },
  { name: "Signature harvest bowl", note: "Crisp greens, roasted vegetables, tahini", price: "$14" },
  { name: "Wood-fired flatbread", note: "Charred crust, slow-cooked beef, fresh herbs", price: "$16" },
];

const servicePillars = [
  {
    icon: "fa-layer-group",
    title: "Clear visual hierarchy",
    text: "Large headings, calmer spacing, and stronger contrast make choices easier to scan.",
  },
  {
    icon: "fa-mobile-screen-button",
    title: "Responsive by default",
    text: "The experience stays usable and premium on mobile, tablet, and desktop.",
  },
  {
    icon: "fa-bag-shopping",
    title: "Fast ordering rhythm",
    text: "Menu browsing, cart actions, and checkout stay focused on the next obvious step.",
  },
  {
    icon: "fa-heart-circle-check",
    title: "Built for repeat visits",
    text: "Consistent cards, controls, and messaging help customers trust the flow quickly.",
  },
];

const orderSteps = [
  {
    step: "01",
    title: "Browse",
    text: "Start from curated categories and jump into the menu without clutter.",
  },
  {
    step: "02",
    title: "Choose",
    text: "Review dishes with stronger pricing, imagery, and faster comparison.",
  },
  {
    step: "03",
    title: "Checkout",
    text: "Move through cart and payment with clearer summaries and fewer distractions.",
  },
  {
    step: "04",
    title: "Track",
    text: "Keep notifications, order status, and delivery updates easy to understand.",
  },
];

const HomePage = () => {
  const [categories, setCategories] = useState([]);

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

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredCategories = (categories.length ? categories : fallbackCategories).slice(0, 4);
  const heroStats = [
    { value: "30 min", label: "average delivery" },
    { value: `${Math.max(categories.length, 8)}+`, label: "curated categories" },
    { value: "4.9/5", label: "guest satisfaction" },
  ];

  return (
    <div className="page home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="hero-kicker">Fast ordering, warmer presentation, cleaner flow</span>
          <h1>Restaurant ordering that feels polished before the food even arrives.</h1>
          <p>
            Flavor Point combines a premium dining identity with clear actions, fast browsing,
            and a checkout flow that stays easy to trust on any device.
          </p>

          <div className="hero-actions">
            <Link className="btn" to="/menu">
              Explore menu
              <i className="fa-solid fa-arrow-right" />
            </Link>
            <Link className="btn-outline" to="/register">Create account</Link>
          </div>

          <div className="hero-metrics">
            {heroStats.map((stat) => (
              <div className="metric-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="home-hero-visual" aria-hidden="true">
          <div className="spotlight-card">
            <span className="spotlight-badge">Chef-curated tonight</span>
            <h2>Balanced plates, smooth delivery, and repeat-order convenience.</h2>

            <div className="spotlight-list">
              {heroPreviewItems.map((item) => (
                <div className="spotlight-item" key={item.name}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.note}</span>
                  </div>
                  <span>{item.price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="floating-note floating-note-top">
            <span className="floating-label">Live service</span>
            <strong>Kitchen preparing in under 12 min</strong>
          </div>

          <div className="floating-note floating-note-bottom">
            <span className="floating-label">Guest rating</span>
            <strong>4.9 out of 5 repeat-order score</strong>
          </div>
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

      <section className="home-story-grid">
        <article className="story-card story-card-dark">
          <p className="section-kicker">What the experience should feel like</p>
          <h2>Confident, warm, and simple enough to use without friction.</h2>
          <p>
            Customers should understand where to start, what matters most, and how to move
            from menu to checkout without guessing.
          </p>

          <div className="story-point-list">
            <div className="story-point">
              <i className="fa-solid fa-circle-check" />
              <span>Sharper calls to action keep primary actions obvious.</span>
            </div>
            <div className="story-point">
              <i className="fa-solid fa-circle-check" />
              <span>Warmer typography and color create a restaurant identity instead of a plain app shell.</span>
            </div>
            <div className="story-point">
              <i className="fa-solid fa-circle-check" />
              <span>Reusable cards and spacing rules make the rest of the pages easier to upgrade consistently.</span>
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
            <p className="section-kicker">How the journey should work</p>
            <h2 className="section-display">From browse to doorstep in four clean steps</h2>
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
          <h2>Every touchpoint is easier to scan, easier to trust, and easier to use again.</h2>
        </div>

        <div className="hospitality-points">
          <div className="hospitality-point">
            <i className="fa-solid fa-check" />
            Clear category browsing
          </div>
          <div className="hospitality-point">
            <i className="fa-solid fa-check" />
            Stronger menu cards
          </div>
          <div className="hospitality-point">
            <i className="fa-solid fa-check" />
            Better mobile spacing
          </div>
          <div className="hospitality-point">
            <i className="fa-solid fa-check" />
            More premium brand feel
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

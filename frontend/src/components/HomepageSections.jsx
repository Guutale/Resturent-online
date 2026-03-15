import React from "react";
import { Link } from "react-router-dom";

const isExternalAction = (value) => /^(https?:\/\/|mailto:|tel:)/i.test(String(value || "").trim());

const SECTION_ITEM_LIMITS = {
  categories: 6,
  "featured-foods": 6,
  "special-offers": 4,
  "why-choose-us": 4,
  "best-sellers": 6,
  testimonials: 3,
};

const sectionAnchorMap = {
  categories: "categories",
  "featured-foods": "featured-foods",
  "special-offers": "offers",
  "why-choose-us": "about",
  "best-sellers": "best-sellers",
  testimonials: "testimonials",
  footer: "contact",
};

const sectionActionMap = {
  categories: { label: "Browse menu", to: "/menu" },
  "featured-foods": { label: "See all meals", to: "/menu" },
  "special-offers": { label: "Explore offers", to: "/#offers" },
  "best-sellers": { label: "Chef menu", to: "/menu" },
};

const ActionLink = ({ className, to, children }) => {
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

const getLimitedItems = (section) => {
  const limit = SECTION_ITEM_LIMITS[section.key];
  return typeof limit === "number" ? section.items.slice(0, limit) : section.items;
};

const formatReadableDate = (value) => {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
};

const formatOfferSchedule = (item) => {
  if (item.startDate && item.endDate) return `${formatReadableDate(item.startDate)} to ${formatReadableDate(item.endDate)}`;
  if (item.startDate) return `Starts ${formatReadableDate(item.startDate)}`;
  if (item.endDate) return `Ends ${formatReadableDate(item.endDate)}`;
  return "Available now";
};

const SectionHeader = ({ section }) => {
  const action = sectionActionMap[section.key];

  return (
    <div className="section-head homepage-section-head">
      <div>
        <p className="section-kicker">{section.label}</p>
        <h2 className="section-display">{section.title}</h2>
      </div>

      <div className="homepage-section-side">
        {section.subtitle && <p className="homepage-section-subtitle">{section.subtitle}</p>}
        {action && (
          <ActionLink className="text-link homepage-section-link" to={action.to}>
            {action.label}
            <i className="fa-solid fa-arrow-right" />
          </ActionLink>
        )}
      </div>
    </div>
  );
};

const PopularCategoriesSection = ({ section }) => {
  const items = getLimitedItems(section);

  return (
    <section id={sectionAnchorMap[section.key]} className="home-section homepage-section-shell">
      <SectionHeader section={section} />
      <div className="homepage-category-grid">
        {items.map((item, index) => (
          <Link key={item.id} className="homepage-category-card" to="/menu">
            <div className="homepage-category-media">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} />
              ) : (
                <div className="homepage-icon-surface"><i className={item.icon} /></div>
              )}
              <span className="homepage-card-index">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="homepage-category-body">
              <div className="homepage-category-title-row">
                <strong>{item.title}</strong>
                {item.labelText && <span className="status-chip">{item.labelText}</span>}
              </div>
              {item.description && <p>{item.description}</p>}
              <span className="text-link homepage-mini-link">
                Explore menu
                <i className="fa-solid fa-arrow-right" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const FeaturedFoodsSection = ({ section }) => {
  const items = getLimitedItems(section);

  return (
    <section id={sectionAnchorMap[section.key]} className="home-section homepage-section-shell">
      <SectionHeader section={section} />
      <div className="home-featured-grid">
        {items.map((item) => (
          <article key={item.id} className="homepage-food-card">
            <div className="homepage-food-media">
              <img src={item.imageUrl} alt={item.title} />
              <div className="homepage-food-overlay" />
              {item.discountBadge && <span className="homepage-food-badge">{item.discountBadge}</span>}
            </div>
            <div className="homepage-food-body">
              <div className="homepage-food-head">
                <span className="section-kicker">{item.category}</span>
                <h3>{item.title}</h3>
              </div>
              {item.description && <p>{item.description}</p>}
              <div className="homepage-food-footer">
                <div className="homepage-price-row">
                  {item.hasDiscount && <span className="homepage-original-price">${item.originalPrice.toFixed(2)}</span>}
                  <strong>${item.finalPrice.toFixed(2)}</strong>
                </div>
                {item.buttonText && item.buttonLink && (
                  <ActionLink className="btn-ghost homepage-card-cta" to={item.buttonLink}>
                    {item.buttonText}
                  </ActionLink>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

const SpecialOffersSection = ({ section }) => {
  const items = getLimitedItems(section);

  return (
    <section id={sectionAnchorMap[section.key]} className="home-section homepage-section-shell">
      <SectionHeader section={section} />
      <div className="special-offer-grid">
        {items.map((item) => (
          <article key={item.id} className="special-offer-card">
            <img src={item.imageUrl} alt={item.title} />
            <div className="special-offer-shade" />
            <div className="special-offer-content">
              <div className="special-offer-top">
                {item.discountBadge && <span className="homepage-food-badge">{item.discountBadge}</span>}
                <span className="special-offer-schedule">{formatOfferSchedule(item)}</span>
              </div>
              <h3>{item.title}</h3>
              {item.description && <p>{item.description}</p>}
              {item.buttonText && item.buttonLink && (
                <ActionLink className="btn" to={item.buttonLink}>
                  {item.buttonText}
                  <i className="fa-solid fa-arrow-right" />
                </ActionLink>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

const WhyChooseUsSection = ({ section }) => {
  const items = getLimitedItems(section);

  return (
    <section id={sectionAnchorMap[section.key]} className="home-section homepage-section-shell">
      <SectionHeader section={section} />
      <div className="why-choose-grid">
        {items.map((item, index) => (
          <article key={item.id} className="why-choose-card">
            {item.imageUrl ? (
              <div className="why-choose-media">
                <img src={item.imageUrl} alt={item.title} />
              </div>
            ) : (
              <div className="homepage-icon-surface is-large">
                <i className={item.icon} />
              </div>
            )}
            <span className="why-choose-index">{String(index + 1).padStart(2, "0")}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

const BestSellersSection = ({ section }) => {
  const items = getLimitedItems(section);

  return (
    <section id={sectionAnchorMap[section.key]} className="home-section homepage-section-shell">
      <SectionHeader section={section} />
      <div className="best-seller-grid">
        {items.map((item) => (
          <article key={item.id} className="best-seller-card">
            <div className="best-seller-media">
              <img src={item.imageUrl} alt={item.title} />
              <div className="best-seller-shade" />
              {item.badgeText && <span className="best-seller-badge">{item.badgeText}</span>}
            </div>
            <div className="best-seller-body">
              <div className="best-seller-head">
                <span className="section-kicker">Chef recommendation</span>
                <h3>{item.title}</h3>
                {item.description && <p>{item.description}</p>}
              </div>
              <div className="best-seller-footer">
                <strong>${item.originalPrice.toFixed(2)}</strong>
                {item.buttonText && item.buttonLink && (
                  <ActionLink className="btn-outline" to={item.buttonLink}>
                    {item.buttonText}
                  </ActionLink>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

const TestimonialsSection = ({ section }) => {
  const items = getLimitedItems(section);

  return (
    <section id={sectionAnchorMap[section.key]} className="home-section homepage-section-shell">
      <SectionHeader section={section} />
      <div className="testimonial-grid">
        {items.map((item) => (
          <article key={item.id} className="testimonial-card">
            <div className="testimonial-head">
              <div className="testimonial-avatar">
                {item.customerImageUrl ? (
                  <img src={item.customerImageUrl} alt={item.customerName} />
                ) : (
                  <span>{(item.customerName || "C").slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div>
                <strong>{item.customerName}</strong>
                <span className="testimonial-role">Guest review</span>
                <div className="testimonial-stars" aria-label={`${item.rating} star review`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <i
                      key={`${item.id}-star-${index}`}
                      className={`fa-solid fa-star${index < item.rating ? " is-filled" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

const ContactSection = ({ section }) => {
  const settings = section.settings || {};
  const detailCards = [
    settings.restaurantName
      ? { label: "Restaurant", content: <strong>{settings.restaurantName}</strong> }
      : null,
    settings.address
      ? { label: "Address", content: <strong>{settings.address}</strong> }
      : null,
    settings.phone
      ? { label: "Phone", content: <a href={`tel:${settings.phone}`}>{settings.phone}</a> }
      : null,
    settings.email
      ? { label: "Email", content: <a href={`mailto:${settings.email}`}>{settings.email}</a> }
      : null,
    settings.openingHours
      ? { label: "Opening Hours", content: <strong>{settings.openingHours}</strong> }
      : null,
  ].filter(Boolean);
  const socialLinks = [
    { label: "Facebook", href: settings.facebookUrl, icon: "fa-brands fa-facebook-f" },
    { label: "Instagram", href: settings.instagramUrl, icon: "fa-brands fa-instagram" },
    { label: "TikTok", href: settings.tiktokUrl, icon: "fa-brands fa-tiktok" },
  ].filter((entry) => entry.href);

  return (
    <section id={sectionAnchorMap[section.key]} className="home-section homepage-section-shell contact-section-shell">
      <div className="contact-section-card">
        <div className="contact-section-copy">
          <p className="section-kicker">{section.label}</p>
          <h2>{section.title}</h2>
          {section.subtitle && <p className="homepage-section-subtitle">{section.subtitle}</p>}

          <div className="contact-action-row">
            {settings.phone && (
              <a className="btn" href={`tel:${settings.phone}`}>
                Call now
                <i className="fa-solid fa-phone" />
              </a>
            )}
            <ActionLink className="btn-outline" to="/menu">
              Browse menu
            </ActionLink>
          </div>

          {detailCards.length > 0 && (
            <div className="contact-detail-grid">
              {detailCards.map((entry) => (
                <div key={entry.label} className="contact-detail-card">
                  <span>{entry.label}</span>
                  {entry.content}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="contact-section-side">
          <div className="contact-highlight-card">
            <p className="section-kicker">Stay connected</p>
            <h3>Make tonight&apos;s next order effortless.</h3>
            <p>Keep the phone, address, email, and social links one click away on every screen size.</p>
            {socialLinks.length > 0 && (
              <div className="contact-social-row">
                {socialLinks.map((entry) => (
                  <a key={entry.label} href={entry.href} target="_blank" rel="noreferrer" aria-label={entry.label}>
                    <i className={entry.icon} />
                  </a>
                ))}
              </div>
            )}
            {Array.isArray(settings.footerLinks) && settings.footerLinks.length > 0 && (
              <div className="contact-link-list">
                {settings.footerLinks.slice(0, 3).map((entry) => (
                  <ActionLink key={`${entry.label}-${entry.href}`} className="contact-link-chip" to={entry.href}>
                    {entry.label}
                  </ActionLink>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const renderSection = (section) => {
  if (!section?.isVisible) return null;
  if (section.key !== "footer" && (!Array.isArray(section.items) || section.items.length === 0)) return null;

  switch (section.key) {
    case "categories":
      return <PopularCategoriesSection key={section.key} section={section} />;
    case "featured-foods":
      return <FeaturedFoodsSection key={section.key} section={section} />;
    case "special-offers":
      return <SpecialOffersSection key={section.key} section={section} />;
    case "why-choose-us":
      return <WhyChooseUsSection key={section.key} section={section} />;
    case "best-sellers":
      return <BestSellersSection key={section.key} section={section} />;
    case "testimonials":
      return <TestimonialsSection key={section.key} section={section} />;
    case "footer":
      return <ContactSection key={section.key} section={section} />;
    default:
      return null;
  }
};

export const HomepageSectionsRenderer = ({ sections = [] }) => (
  <>
    {sections.map((section) => renderSection(section))}
  </>
);

export default HomepageSectionsRenderer;

import React from "react";
import { Link } from "react-router-dom";

const isExternalAction = (value) => /^(https?:\/\/|mailto:|tel:)/i.test(String(value || "").trim());

const sectionAnchorMap = {
  categories: "categories",
  "featured-foods": "featured-foods",
  "special-offers": "offers",
  "why-choose-us": "about",
  "best-sellers": "best-sellers",
  testimonials: "testimonials",
  footer: "contact",
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

const SectionHeader = ({ section }) => (
  <div className="section-head homepage-section-head">
    <div>
      <p className="section-kicker">{section.label}</p>
      <h2 className="section-display">{section.title}</h2>
    </div>
    {section.subtitle && <p className="homepage-section-subtitle">{section.subtitle}</p>}
  </div>
);

const PopularCategoriesSection = ({ section }) => (
  <section id={sectionAnchorMap[section.key]} className="home-section homepage-section-shell">
    <SectionHeader section={section} />
    <div className="homepage-category-grid">
      {section.items.map((item) => (
        <Link key={item.id} className="homepage-category-card" to="/menu">
          <div className="homepage-category-media">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} />
            ) : (
              <div className="homepage-icon-surface"><i className={item.icon} /></div>
            )}
          </div>
          <div className="homepage-category-body">
            <strong>{item.title}</strong>
            {item.labelText && <span>{item.labelText}</span>}
            {item.description && <p>{item.description}</p>}
          </div>
        </Link>
      ))}
    </div>
  </section>
);

const FeaturedFoodsSection = ({ section }) => (
  <section id={sectionAnchorMap[section.key]} className="home-section homepage-section-shell">
    <SectionHeader section={section} />
    <div className="home-featured-grid">
      {section.items.map((item) => (
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
            <div className="homepage-price-row">
              {item.hasDiscount && <span className="homepage-original-price">${item.originalPrice.toFixed(2)}</span>}
              <strong>${item.finalPrice.toFixed(2)}</strong>
            </div>
            {item.buttonText && item.buttonLink && (
              <ActionLink className="btn-ghost" to={item.buttonLink}>
                {item.buttonText}
              </ActionLink>
            )}
          </div>
        </article>
      ))}
    </div>
  </section>
);

const SpecialOffersSection = ({ section }) => (
  <section id={sectionAnchorMap[section.key]} className="home-section homepage-section-shell">
    <SectionHeader section={section} />
    <div className="special-offer-grid">
      {section.items.map((item) => (
        <article key={item.id} className="special-offer-card">
          <img src={item.imageUrl} alt={item.title} />
          <div className="special-offer-shade" />
          <div className="special-offer-content">
            {item.discountBadge && <span className="homepage-food-badge">{item.discountBadge}</span>}
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

const WhyChooseUsSection = ({ section }) => (
  <section id={sectionAnchorMap[section.key]} className="home-section homepage-section-shell">
    <SectionHeader section={section} />
    <div className="why-choose-grid">
      {section.items.map((item) => (
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
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </article>
      ))}
    </div>
  </section>
);

const BestSellersSection = ({ section }) => (
  <section id={sectionAnchorMap[section.key]} className="home-section homepage-section-shell">
    <SectionHeader section={section} />
    <div className="best-seller-grid">
      {section.items.map((item) => (
        <article key={item.id} className="best-seller-card">
          <div className="best-seller-media">
            <img src={item.imageUrl} alt={item.title} />
            <div className="best-seller-shade" />
            {item.badgeText && <span className="best-seller-badge">{item.badgeText}</span>}
          </div>
          <div className="best-seller-body">
            <div>
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

const TestimonialsSection = ({ section }) => (
  <section id={sectionAnchorMap[section.key]} className="home-section homepage-section-shell">
    <SectionHeader section={section} />
    <div className="testimonial-grid">
      {section.items.map((item) => (
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

const ContactSection = ({ section }) => {
  const settings = section.settings || {};
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
          <div className="contact-detail-grid">
            <div className="contact-detail-card">
              <span>Restaurant</span>
              <strong>{settings.restaurantName}</strong>
            </div>
            <div className="contact-detail-card">
              <span>Address</span>
              <strong>{settings.address}</strong>
            </div>
            <div className="contact-detail-card">
              <span>Phone</span>
              <a href={`tel:${settings.phone}`}>{settings.phone}</a>
            </div>
            <div className="contact-detail-card">
              <span>Email</span>
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            </div>
            <div className="contact-detail-card">
              <span>Opening Hours</span>
              <strong>{settings.openingHours}</strong>
            </div>
          </div>
        </div>
        <div className="contact-section-side">
          <div className="contact-highlight-card">
            <p className="section-kicker">Stay connected</p>
            <h3>Make the last section easy to act on.</h3>
            <p>Keep the phone, address, email, and social links one click away on every screen size.</p>
            <div className="contact-social-row">
              {socialLinks.map((entry) => (
                <a key={entry.label} href={entry.href} target="_blank" rel="noreferrer" aria-label={entry.label}>
                  <i className={entry.icon} />
                </a>
              ))}
            </div>
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

import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import { normalizeHomepageSection } from "../../lib/homepageContent";

const FinanceDiscountImpactPage = () => {
  const [heroSlides, setHeroSlides] = useState([]);
  const [homepageSections, setHomepageSections] = useState([]);

  useEffect(() => {
    apiRequest("/hero-slides")
      .then((data) => setHeroSlides(data.items || []))
      .catch(() => setHeroSlides([]));

    apiRequest("/homepage-content")
      .then((data) => setHomepageSections((data.sections || []).map((section) => normalizeHomepageSection(section))))
      .catch(() => setHomepageSections([]));
  }, []);

  const homepageOffers = useMemo(
    () => homepageSections.find((section) => section.key === "special-offers")?.items || [],
    [homepageSections]
  );

  const exposure = useMemo(() => {
    const activeHeroSavings = heroSlides.reduce((sum, item) => sum + Math.max(0, Number(item.originalPrice || 0) - Number(item.finalPrice || item.originalPrice || 0)), 0);
    const activeHomepageSavings = homepageOffers.reduce((sum, item) => sum + Math.max(0, Number(item.discountValue || 0)), 0);
    return {
      heroCount: heroSlides.length,
      homepageOfferCount: homepageOffers.length,
      totalExposure: activeHeroSavings + activeHomepageSavings,
    };
  }, [heroSlides, homepageOffers]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Discounts Impact</h1>
          <p className="admin-subtitle">Current promotional exposure based on active homepage and hero discounts being advertised.</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        {[
          { label: "Hero Promotions", value: exposure.heroCount, icon: "fa-images", money: false },
          { label: "Homepage Offers", value: exposure.homepageOfferCount, icon: "fa-bolt", money: false },
          { label: "Tracked Promo Exposure", value: exposure.totalExposure, icon: "fa-percent", money: true },
        ].map((card, index) => (
          <div key={card.label} className={`admin-stat-card animate-fade-in delay-${(index + 1) * 100}`}>
            <div className="admin-stat-top">
              <div className="admin-stat-icon"><i className={`fa-solid ${card.icon}`} /></div>
              <div>
                <div className="admin-stat-number">{card.money ? `$${Number(card.value || 0).toFixed(2)}` : card.value}</div>
                <div className="admin-stat-label">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-surface">
        <div className="admin-surface-head">
          <h3 className="admin-surface-title">Active Promotional Items</h3>
          <p className="admin-surface-subtitle">This view reflects currently published discounts. Order-level realized discount tracking can be layered in later without changing this dashboard structure.</p>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Source</th>
                <th>Title</th>
                <th>Discount</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {heroSlides.map((item) => (
                <tr key={item._id || item.id}>
                  <td>Hero</td>
                  <td style={{ fontWeight: 900 }}>{item.title}</td>
                  <td className="admin-muted">{item.discountType === "percentage" ? `${item.discountValue}%` : item.discountType === "fixed" ? `$${item.discountValue}` : "-"}</td>
                  <td>${Number(item.finalPrice || item.originalPrice || 0).toFixed(2)}</td>
                </tr>
              ))}
              {homepageOffers.map((item) => (
                <tr key={item.id}>
                  <td>Homepage Offer</td>
                  <td style={{ fontWeight: 900 }}>{item.title}</td>
                  <td className="admin-muted">{item.discountBadge || "-"}</td>
                  <td>${Number(item.finalPrice || 0).toFixed(2)}</td>
                </tr>
              ))}
              {heroSlides.length === 0 && homepageOffers.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-empty-cell">No active promotional content is currently published.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceDiscountImpactPage;

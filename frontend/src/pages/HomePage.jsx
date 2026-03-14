import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import HeroBannerSlider from "../components/HeroBannerSlider";
import HomepageSectionsRenderer from "../components/HomepageSections";
import { apiRequest } from "../lib/api";
import { normalizeHeroSlide } from "../lib/heroSlides";

const HomePage = () => {
  const outletContext = useOutletContext() || {};
  const homepageContent = outletContext.homepageContent || { sections: [] };
  const homepageLoading = Boolean(outletContext.homepageLoading);
  const [heroSlides, setHeroSlides] = useState([]);
  const [heroLoading, setHeroLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

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

  return (
    <div className="page home-page">
      <HeroBannerSlider slides={heroSlides} loading={heroLoading} />

      {homepageLoading ? (
        <section className="home-section homepage-section-shell homepage-loading-shell">
          <div className="homepage-loading-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <article key={`homepage-loading-${index}`} className="homepage-loading-card" aria-hidden="true">
                <div className="homepage-loading-media" />
                <div className="homepage-loading-body">
                  <span className="homepage-loading-line short" />
                  <span className="homepage-loading-line wide" />
                  <span className="homepage-loading-line" />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <HomepageSectionsRenderer sections={homepageContent.sections} />
      )}
    </div>
  );
};

export default HomePage;

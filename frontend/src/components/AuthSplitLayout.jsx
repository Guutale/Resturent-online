import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiRequest } from "../lib/api";
import {
  getFallbackAuthBranding,
  normalizeAuthBrandingCollection,
  resolvePublicAuthBranding,
} from "../lib/authBranding";
import AuthBrandShowcase from "./AuthBrandShowcase";

const AuthSplitLayout = ({
  pageType,
  formEyebrow,
  formTitle,
  formCaption,
  formIcon,
  highlights = [],
  children,
}) => {
  const outletContext = useOutletContext() || {};
  const restaurantName =
    outletContext.homepageContent?.sectionsByKey?.footer?.settings?.restaurantName || "Flavor Point";
  const [branding, setBranding] = useState(() => getFallbackAuthBranding(pageType, { restaurantName }));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBranding(getFallbackAuthBranding(pageType, { restaurantName }));
  }, [pageType, restaurantName]);

  useEffect(() => {
    let isMounted = true;

    apiRequest("/auth-branding")
      .then((data) => {
        if (!isMounted) return;
        const normalized = normalizeAuthBrandingCollection(data);
        setBranding(resolvePublicAuthBranding(normalized.itemsByPageType[pageType], pageType, { restaurantName }));
      })
      .catch(() => {
        if (!isMounted) return;
        setBranding(getFallbackAuthBranding(pageType, { restaurantName }));
      })
      .finally(() => {
        if (isMounted) setLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [pageType, restaurantName]);

  return (
    <div className={`page auth-page auth-premium-page${loaded ? " is-loaded" : ""}`}>
      <section className="auth-premium-shell">
        <AuthBrandShowcase branding={branding} pageType={pageType} highlights={highlights} />

        <div className="auth-form-panel">
          <div className="auth-form-surface">
            <div className="auth-form-head">
              <span className="auth-form-icon" aria-hidden="true">
                <i className={formIcon} />
              </span>
              <div className="auth-form-copy">
                <p className="auth-form-eyebrow">{formEyebrow}</p>
                <h2 className="auth-form-title">{formTitle}</h2>
                <p className="auth-form-caption">{formCaption}</p>
              </div>
            </div>

            {children}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthSplitLayout;

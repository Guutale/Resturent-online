import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useCart } from "../context/CartContext";

const defaultSort = "-createdAt";

const sortLabels = {
  "-createdAt": "Newest arrivals",
  price: "Price low to high",
  "-price": "Price high to low",
};

const MenuPage = () => {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const { addToCart } = useCart();

  const category = params.get("category") || "";
  const search = params.get("search") || "";
  const sort = params.get("sort") || defaultSort;

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    setParams(next);
  };

  const clearFilters = () => {
    setParams(new URLSearchParams());
  };

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

  useEffect(() => {
    let isMounted = true;

    setLoading(true);

    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    if (search) qs.set("search", search);
    if (sort) qs.set("sort", sort);

    apiRequest(`/products?${qs.toString()}`)
      .then((data) => {
        if (!isMounted) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        if (!isMounted) return;
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [category, search, sort]);

  const activeCategory = categories.find((entry) => entry.slug === category) || null;
  const hasFilters = Boolean(category || search || sort !== defaultSort);
  const selectionTitle = activeCategory?.name || "All dishes";
  const resultSummary = total
    ? `Showing ${items.length} of ${total} dishes`
    : `${items.length} dishes available`;

  return (
    <div className="page menu-page">
      <section className="menu-hero">
        <div>
          <p className="section-kicker">Curated menu experience</p>
          <h1 className="menu-hero-title">Browse the full kitchen without losing the next step.</h1>
          <p className="menu-hero-copy">
            Search dishes, jump across categories, compare prep time and price,
            and move straight into ordering with less friction.
          </p>
        </div>

        <div className="menu-hero-stats">
          <div className="menu-stat-card">
            <span>Categories</span>
            <strong>{categories.length || "--"}</strong>
          </div>
          <div className="menu-stat-card">
            <span>Current results</span>
            <strong>{total || items.length || "--"}</strong>
          </div>
          <div className="menu-stat-card">
            <span>Sort order</span>
            <strong>{sortLabels[sort] || "Custom"}</strong>
          </div>
        </div>
      </section>

      <section className="panel menu-toolbar">
        <div className="section-head">
          <div>
            <p className="section-kicker">Filters</p>
            <h2 className="section-display">Find what matches the order</h2>
          </div>

          {hasFilters && (
            <button type="button" className="btn-ghost" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        <div className="filter-grid">
          <label className="search-field">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              placeholder="Search a dish, ingredient, or tag"
              value={search}
              onChange={(e) => updateParam("search", e.target.value.trim() ? e.target.value : "")}
            />
          </label>

          <select value={category} onChange={(e) => updateParam("category", e.target.value)}>
            <option value="">All categories</option>
            {categories.map((entry) => (
              <option key={entry._id} value={entry.slug}>
                {entry.name}
              </option>
            ))}
          </select>

          <select value={sort} onChange={(e) => updateParam("sort", e.target.value)}>
            <option value="-createdAt">Newest arrivals</option>
            <option value="price">Price low to high</option>
            <option value="-price">Price high to low</option>
          </select>

          <Link className="btn menu-filter-cta" to="/cart">
            <i className="fa-solid fa-bag-shopping" />
            Go to cart
          </Link>
        </div>

        <div className="category-strip">
          <button
            type="button"
            className={`category-filter ${!category ? "is-active" : ""}`}
            onClick={() => updateParam("category", "")}
          >
            All dishes
          </button>

          {categories.map((entry) => (
            <button
              type="button"
              key={entry._id}
              className={`category-filter ${category === entry.slug ? "is-active" : ""}`}
              onClick={() => updateParam("category", entry.slug)}
            >
              {entry.name}
            </button>
          ))}
        </div>
      </section>

      <section className="menu-results">
        <div className="menu-results-head">
          <div>
            <p className="section-kicker">Current selection</p>
            <h2 className="section-display">{selectionTitle}</h2>
            <p className="muted">
              {resultSummary}
              {search ? ` for "${search}"` : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="panel menu-loading">
            <i className="fa-solid fa-spinner" />
            Loading menu...
          </div>
        ) : items.length === 0 ? (
          <div className="panel menu-empty">
            <h3>No dishes matched this filter combination.</h3>
            <p className="muted">Try a different category, remove the search term, or reset the sort.</p>
            {hasFilters && (
              <button type="button" className="btn-ghost" onClick={clearFilters}>
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="menu-grid">
            {items.map((item) => {
              const outOfStock = !item.isAvailable || (typeof item.stockQty === "number" && item.stockQty === 0);
              const lowStock =
                !outOfStock
                && typeof item.stockQty === "number"
                && typeof item.lowStockThreshold === "number"
                && item.stockQty <= item.lowStockThreshold;
              const categoryName = item.categoryId?.name || "Kitchen pick";
              const prepLabel = item.prepTimeMinutes ? `${item.prepTimeMinutes} min prep` : "Prepared fresh";
              const itemTags = Array.isArray(item.tags) ? item.tags.slice(0, 3) : [];

              return (
                <article className="menu-card" key={item._id}>
                  <Link className="menu-card-media" to={`/menu/${item._id}`}>
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=1200"}
                      alt={item.title}
                    />
                    <span className="menu-card-category">{categoryName}</span>
                    <span className={`inventory-pill ${outOfStock ? "is-out" : lowStock ? "is-low" : ""}`}>
                      {outOfStock ? "Out of stock" : lowStock ? `Only ${item.stockQty} left` : "Available"}
                    </span>
                  </Link>

                  <div className="menu-card-body">
                    <div className="menu-card-head">
                      <div>
                        <h3>{item.title}</h3>
                        <p className="muted">
                          {item.description || "Prepared for fast ordering with a cleaner restaurant-first presentation."}
                        </p>
                      </div>
                      <span className="menu-price">${Number(item.price).toFixed(2)}</span>
                    </div>

                    <div className="menu-card-meta">
                      <span>
                        <i className="fa-regular fa-clock" />
                        {prepLabel}
                      </span>
                      <span>
                        <i className="fa-solid fa-layer-group" />
                        {categoryName}
                      </span>
                    </div>

                    {itemTags.length > 0 && (
                      <div className="menu-card-tags">
                        {itemTags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="menu-card-actions">
                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={() => addToCart(item, 1)}
                      >
                        <i className="fa-solid fa-plus" />
                        {outOfStock ? "Unavailable" : "Add to cart"}
                      </button>
                      <Link className="btn-ghost" to={`/menu/${item._id}`}>View details</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default MenuPage;

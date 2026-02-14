import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

const HomePage = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    apiRequest("/categories")
      .then((d) => setCategories(d.items || []))
      .catch(() => {});
  }, []);

  return (
    <div className="page">
      <section className="hero" style={{ marginBottom: "1rem" }}>
        <div>
          <span className="hero-badge"><i className="fa-solid fa-fire" /> Fresh & Fast</span>
          <h1>Order Delicious Food <span>Anytime</span></h1>
          <p>
            Beautiful online restaurant experience with clean interface, fast ordering, and smooth interactions.
          </p>
          <div className="hero-actions">
            <Link className="btn" to="/menu">Order Now</Link>
            <Link className="btn-outline" to="/menu">Explore Menu</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-icon">
            <i className="fa-solid fa-bowl-food" />
          </div>
        </div>
      </section>

      <h2 className="page-title">Popular Categories</h2>
      <div className="grid" style={{ marginBottom: "1rem" }}>
        {categories.map((c) => (
          <Link className="card" key={c._id} to={`/menu?category=${c.slug}`}>
            <img
              src={c.imageUrl || "https://images.unsplash.com/photo-1543353071-10c8ba85a904?w=800"}
              alt={c.name}
            />
            <div className="card-b">
              <div className="row-between">
                <strong>{c.name}</strong>
                <span className="status-chip">Explore</span>
              </div>
              <p className="muted" style={{ margin: "0.35rem 0 0" }}>Fresh picks in {c.name}</p>
            </div>
          </Link>
        ))}
      </div>

      <section className="section-block">
        <h2 className="section-title">simple & <span>fast</span></h2>
        <div className="feature-grid">
          <article className="feature-card">
            <span className="icon-wrap"><i className="fa-solid fa-location-dot" /></span>
            <h4 style={{ margin: "0 0 0.35rem" }}>Choose Location</h4>
            <p className="muted" style={{ margin: 0 }}>Set your delivery location in seconds.</p>
          </article>

          <article className="feature-card">
            <span className="icon-wrap"><i className="fa-solid fa-utensils" /></span>
            <h4 style={{ margin: "0 0 0.35rem" }}>Pick Your Meal</h4>
            <p className="muted" style={{ margin: 0 }}>Browse clean cards with clear prices.</p>
          </article>

          <article className="feature-card">
            <span className="icon-wrap"><i className="fa-solid fa-motorcycle" /></span>
            <h4 style={{ margin: "0 0 0.35rem" }}>Fast Delivery</h4>
            <p className="muted" style={{ margin: 0 }}>Quick checkout and timely order arrival.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const statusClass = (status) => `badge ${status}`;

const toDayKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

const AdminDashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    Promise.all([
      apiRequest("/orders?limit=100").then((d) => d.items || []).catch(() => []),
      apiRequest("/users?limit=100").then((d) => d.items || []).catch(() => []),
      apiRequest("/products?limit=100").then((d) => d.items || []).catch(() => []),
      apiRequest("/hero-slides").then((d) => d.items || []).catch(() => []),
    ]).then(([orderItems, userItems, productItems, offerItems]) => {
      setOrders(orderItems);
      setUsers(userItems);
      setProducts(productItems);
      setOffers(offerItems);
    });
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const todayKey = toDayKey(new Date());
    const todayOrders = orders.filter((o) => toDayKey(o.createdAt) === todayKey).length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const totalUsers = users.length;
    const totalFoods = products.length;
    const activeOffers = offers.length;
    const pendingDeliveries = orders.filter((o) => ["assigned", "out_for_delivery"].includes(o.status)).length;
    const lowStockFoods = products.filter((product) => typeof product.stockQty === "number" && product.stockQty <= Number(product.lowStockThreshold || 0)).length;
    return {
      totalOrders,
      totalRevenue,
      todayOrders,
      pendingOrders,
      totalUsers,
      totalFoods,
      activeOffers,
      pendingDeliveries,
      lowStockFoods,
    };
  }, [offers, orders, products, users]);

  const chart = useMemo(() => {
    const points = [];
    const labels = [];
    const values = [];

    const today = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      labels.push(d.toLocaleDateString(undefined, { weekday: "short" }));
      values.push(0);
    }

    orders.forEach((o) => {
      const created = new Date(o.createdAt);
      const diffDays = Math.floor((today - created) / (1000 * 60 * 60 * 24));
      const idx = 6 - diffDays;
      if (idx >= 0 && idx < 7) values[idx] += Number(o.total || 0);
    });

    const w = 520;
    const h = 160;
    const pad = 18;
    const max = Math.max(...values, 1);
    const step = (w - pad * 2) / (values.length - 1);

    for (let i = 0; i < values.length; i += 1) {
      const x = pad + step * i;
      const y = h - pad - (values[i] / max) * (h - pad * 2);
      points.push({ x, y });
    }

    const line = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const area = `${line} L ${points[points.length - 1].x.toFixed(1)} ${(h - pad).toFixed(1)} L ${points[0].x.toFixed(1)} ${(h - pad).toFixed(1)} Z`;

    return { labels, values, w, h, pad, line, area };
  }, [orders]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-subtitle">Overview of orders and revenue.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-link" to="/admin/orders">View all</Link>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card animate-fade-in delay-100">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-bag-shopping" /></div>
            <div>
              <div className="admin-stat-number">{stats.totalOrders}</div>
              <div className="admin-stat-label">Total Orders</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-200">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-dollar-sign" /></div>
            <div>
              <div className="admin-stat-number">${stats.totalRevenue.toFixed(2)}</div>
              <div className="admin-stat-label">Total Revenue</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-300">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-calendar-day" /></div>
            <div>
              <div className="admin-stat-number">{stats.todayOrders}</div>
              <div className="admin-stat-label">Today's Orders</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-400">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-clock" /></div>
            <div>
              <div className="admin-stat-number">{stats.pendingOrders}</div>
              <div className="admin-stat-label">Pending</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-100">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-users" /></div>
            <div>
              <div className="admin-stat-number">{stats.totalUsers}</div>
              <div className="admin-stat-label">Users</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-200">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-burger" /></div>
            <div>
              <div className="admin-stat-number">{stats.totalFoods}</div>
              <div className="admin-stat-label">Foods</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-300">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-tags" /></div>
            <div>
              <div className="admin-stat-number">{stats.activeOffers}</div>
              <div className="admin-stat-label">Active Offers</div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card animate-fade-in delay-400">
          <div className="admin-stat-top">
            <div className="admin-stat-icon"><i className="fa-solid fa-truck-fast" /></div>
            <div>
              <div className="admin-stat-number">{stats.pendingDeliveries}</div>
              <div className="admin-stat-label">Pending Deliveries</div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-two-col">
        <div className="admin-surface admin-chart-card">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Revenue (7 days)</h3>
            <p className="admin-surface-subtitle">Daily totals, last 7 days.</p>
          </div>
          <div className="admin-chart">
            <svg viewBox={`0 0 ${chart.w} ${chart.h}`} className="admin-chart-svg" role="img" aria-label="Revenue chart">
              <defs>
                <linearGradient id="fpArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,164,0,0.55)" />
                  <stop offset="100%" stopColor="rgba(255,164,0,0.03)" />
                </linearGradient>
                <linearGradient id="fpLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255,164,0,0.9)" />
                  <stop offset="100%" stopColor="rgba(255,120,0,0.9)" />
                </linearGradient>
              </defs>
              <path d={chart.area} fill="url(#fpArea)" />
              <path d={chart.line} fill="none" stroke="url(#fpLine)" strokeWidth="3" strokeLinejoin="round" />
            </svg>
            <div className="admin-chart-labels">
              {chart.labels.map((l, idx) => (
                <span key={`${l}-${idx}`}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-surface">
          <div className="admin-surface-head row-between">
            <div>
              <h3 className="admin-surface-title">Recent Orders</h3>
              <p className="admin-surface-subtitle">Latest orders placed by customers.</p>
            </div>
            <Link className="admin-link" to="/admin/orders">View All</Link>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={o._id}>
                    <td>
                      <Link className="admin-link" to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link>
                    </td>
                    <td><span className={statusClass(o.status)}>{o.status}</span></td>
                    <td>${Number(o.total || 0).toFixed(2)}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="admin-empty-cell">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin-surface" style={{ marginTop: "1.2rem" }}>
        <div className="admin-surface-head">
          <h3 className="admin-surface-title">Operational Watchlist</h3>
          <p className="admin-surface-subtitle">Immediate issues that may need admin attention.</p>
        </div>
        <div className="admin-kv">
          <div>
            <div className="admin-muted">Today&apos;s Orders</div>
            <div className="admin-kv-strong">{stats.todayOrders}</div>
          </div>
          <div>
            <div className="admin-muted">Low Stock Foods</div>
            <div className="admin-kv-strong">{stats.lowStockFoods}</div>
          </div>
          <div>
            <div className="admin-muted">Orders Awaiting Action</div>
            <div className="admin-kv-strong">{stats.pendingOrders + stats.pendingDeliveries}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

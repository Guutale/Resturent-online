import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";

const WaiterDashboardPage = () => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    Promise.all([
      apiRequest("/orders/waiter?scope=active&limit=100").then((data) => data.items || []).catch(() => []),
      apiRequest("/orders/waiter?scope=history&limit=100").then((data) => data.items || []).catch(() => []),
      apiRequest("/tables?limit=200").then((data) => data.items || []).catch(() => []),
    ]).then(([activeItems, historyItems, tableItems]) => {
      setActiveOrders(activeItems);
      setHistoryOrders(historyItems);
      setTables(tableItems);
    });
  }, []);

  const stats = useMemo(() => ({
    activeOrders: activeOrders.length,
    readyOrders: activeOrders.filter((order) => order.status === "ready").length,
    servedOrders: historyOrders.filter((order) => order.status === "delivered").length,
    occupiedTables: tables.filter((table) => table.status === "occupied").length,
    availableTables: tables.filter((table) => table.status === "available").length,
  }), [activeOrders, historyOrders, tables]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Waiter Dashboard</h1>
          <p className="admin-subtitle">Handle dine-in orders, follow kitchen progress, and keep tables moving.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-link" to="/waiter/new-order">Create new table order</Link>
        </div>
      </div>

      <div className="admin-stats-grid">
        {[
          { label: "Active Orders", value: stats.activeOrders, icon: "fa-utensils" },
          { label: "Ready to Serve", value: stats.readyOrders, icon: "fa-bell-concierge" },
          { label: "Served Orders", value: stats.servedOrders, icon: "fa-clipboard-check" },
          { label: "Occupied Tables", value: stats.occupiedTables, icon: "fa-table-cells-large" },
        ].map((card, index) => (
          <div key={card.label} className={`admin-stat-card animate-fade-in delay-${(index + 1) * 100}`}>
            <div className="admin-stat-top">
              <div className="admin-stat-icon"><i className={`fa-solid ${card.icon}`} /></div>
              <div>
                <div className="admin-stat-number">{card.value}</div>
                <div className="admin-stat-label">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-two-col">
        <section className="admin-surface">
          <div className="admin-surface-head row-between">
            <div>
              <h3 className="admin-surface-title">Live Table Orders</h3>
              <p className="admin-surface-subtitle">Current dine-in orders waiting for service or kitchen progress.</p>
            </div>
            <Link className="admin-link" to="/waiter/active-orders">View all</Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-striped">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Table</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.slice(0, 8).map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontWeight: 900 }}>{order.orderNumber}</td>
                    <td className="admin-muted">{order.tableLabel || "-"}</td>
                    <td><span className={`badge ${order.status}`}>{order.status}</span></td>
                    <td>${Number(order.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {activeOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="admin-empty-cell">No active dine-in orders.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-surface">
          <div className="admin-surface-head row-between">
            <div>
              <h3 className="admin-surface-title">Table Status</h3>
              <p className="admin-surface-subtitle">Quick scan of available and occupied tables.</p>
            </div>
            <Link className="admin-link" to="/waiter/tables">Open tables</Link>
          </div>
          <div className="dashboard-table-grid">
            {tables.slice(0, 8).map((table) => (
              <article key={table._id} className={`dashboard-table-card ${table.status}`}>
                <div className="dashboard-table-name">{table.name}</div>
                <div className="dashboard-table-meta">Capacity {table.capacity}</div>
                <span className={`badge ${table.status === "available" ? "delivered" : table.status === "occupied" ? "preparing" : "pending"}`}>{table.status}</span>
              </article>
            ))}
            {tables.length === 0 && (
              <div className="admin-empty-state">
                <div className="admin-empty-icon"><i className="fa-solid fa-table-cells-large" /></div>
                <div className="admin-empty-title">No tables configured yet</div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default WaiterDashboardPage;

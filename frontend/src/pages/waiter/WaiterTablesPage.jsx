import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

const WaiterTablesPage = () => {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    apiRequest("/tables?limit=200")
      .then((data) => setTables(data.items || []))
      .catch(() => setTables([]));

    apiRequest("/orders/waiter?scope=active&limit=100")
      .then((data) => setOrders(data.items || []))
      .catch(() => setOrders([]));
  }, []);

  const activeByTable = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      const key = String(order.tableId || order.tableLabel || "");
      map.set(key, order);
    });
    return map;
  }, [orders]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Tables</h1>
          <p className="admin-subtitle">Live view of table availability and open dine-in tickets.</p>
        </div>
      </div>

      <div className="dashboard-table-grid">
        {tables.map((table) => {
          const liveOrder = activeByTable.get(String(table._id)) || activeByTable.get(String(table.name));
          return (
            <article key={table._id} className={`dashboard-table-card ${table.status}`}>
              <div className="dashboard-table-name">{table.name}</div>
              <div className="dashboard-table-meta">Capacity {table.capacity}</div>
              <span className={`badge ${table.status === "available" ? "delivered" : table.status === "occupied" ? "preparing" : "pending"}`}>{table.status}</span>
              {liveOrder ? (
                <div className="dashboard-table-order">
                  <strong>{liveOrder.orderNumber}</strong>
                  <span>{liveOrder.status}</span>
                </div>
              ) : (
                <div className="admin-muted">No active order</div>
              )}
            </article>
          );
        })}
        {tables.length === 0 && (
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><i className="fa-solid fa-table-cells-large" /></div>
            <div className="admin-empty-title">No tables configured</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterTablesPage;

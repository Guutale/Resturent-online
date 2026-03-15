import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";

const FinanceRevenuePage = () => {
  const [summary, setSummary] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    apiRequest(`/finance/revenue${params.toString() ? `?${params.toString()}` : ""}`)
      .then((data) => setSummary(data.summary))
      .catch(() => setSummary(null));
  }, [from, to]);

  const cards = useMemo(() => [
    { label: "Paid Revenue", value: Number(summary?.paid?.totalAmount || 0), icon: "fa-circle-check" },
    { label: "Unpaid Revenue", value: Number(summary?.unpaid?.totalAmount || 0), icon: "fa-hourglass-half" },
    { label: "Refunded", value: Number(summary?.refunded?.totalAmount || 0), icon: "fa-rotate-left" },
    { label: "Net Revenue", value: Number(summary?.netAmount || 0), icon: "fa-sack-dollar" },
  ], [summary]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Revenue</h1>
          <p className="admin-subtitle">Filter payment revenue by date and review paid, unpaid, and refunded totals.</p>
        </div>
        <div className="admin-actions">
          <input className="admin-input admin-date" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <input className="admin-input admin-date" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      </div>

      <div className="admin-stats-grid">
        {cards.map((card, index) => (
          <div key={card.label} className={`admin-stat-card animate-fade-in delay-${(index + 1) * 100}`}>
            <div className="admin-stat-top">
              <div className="admin-stat-icon"><i className={`fa-solid ${card.icon}`} /></div>
              <div>
                <div className="admin-stat-number">${card.value.toFixed(2)}</div>
                <div className="admin-stat-label">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinanceRevenuePage;

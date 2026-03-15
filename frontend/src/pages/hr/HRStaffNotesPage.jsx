import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const HRStaffNotesPage = () => {
  const [items, setItems] = useState([]);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    apiRequest("/staff?limit=500")
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));

  useEffect(() => {
    load();
  }, []);

  const updateNote = async (item) => {
    setError("");
    setSavingId(item._id);
    try {
      await apiRequest(`/staff/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ staff: { notes: item.staff?.notes || "" } }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Staff Notes</h1>
          <p className="admin-subtitle">Maintain HR notes for managed staff profiles.</p>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="dashboard-note-grid">
        {items.map((item) => (
          <article key={item._id} className="admin-surface dashboard-note-card">
            <div className="admin-surface-head">
              <div>
                <h3 className="admin-surface-title">{item.name}</h3>
                <p className="admin-surface-subtitle">{item.role}</p>
              </div>
              <span className={`badge ${item.staff?.employmentStatus === "active" ? "delivered" : "cancelled"}`}>
                {item.staff?.employmentStatus || "active"}
              </span>
            </div>

            <textarea
              className="admin-input"
              rows={4}
              value={item.staff?.notes || ""}
              onChange={(event) => {
                const nextValue = event.target.value;
                setItems((current) => current.map((entry) => (
                  entry._id === item._id
                    ? { ...entry, staff: { ...(entry.staff || {}), notes: nextValue } }
                    : entry
                )));
              }}
            />

            <div className="admin-modal-actions" style={{ justifyContent: "flex-start" }}>
              <button type="button" className="admin-btn-primary" onClick={() => updateNote(item)} disabled={savingId === item._id}>
                {savingId === item._id ? "Saving..." : "Save note"}
              </button>
            </div>
          </article>
        ))}
        {items.length === 0 && (
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><i className="fa-solid fa-notes-medical" /></div>
            <div className="admin-empty-title">No staff notes yet</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRStaffNotesPage;

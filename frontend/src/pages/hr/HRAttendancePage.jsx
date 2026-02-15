import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const HRAttendancePage = () => {
  const [staff, setStaff] = useState([]);
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    apiRequest("/staff?limit=500")
      .then((d) => setStaff(d.items || []))
      .catch(() => setStaff([]));
  }, []);

  const load = () => {
    if (!staffId) return Promise.resolve();
    const params = new URLSearchParams();
    params.set("staffUserId", staffId);
    params.set("limit", "50");
    return apiRequest(`/attendance?${params.toString()}`)
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, [staffId]);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await apiRequest("/attendance", {
        method: "POST",
        body: JSON.stringify({
          staffUserId: staffId,
          date,
          checkInTime: checkInTime ? `${date}T${checkInTime}:00` : undefined,
          checkOutTime: checkOutTime ? `${date}T${checkOutTime}:00` : undefined,
          notes,
        }),
      });
      setMsg("Attendance saved.");
      setCheckInTime("");
      setCheckOutTime("");
      setNotes("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Attendance</h1>
          <p className="admin-subtitle">Record staff check-in/check-out and view history.</p>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}
      {msg && <div className="admin-alert" style={{ borderLeftColor: "#16a34a", color: "#166534" }}>{msg}</div>}

      <div className="admin-two-col">
        <div className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">Record Attendance</h3>
            <p className="admin-surface-subtitle">Creates or updates attendance for a date.</p>
          </div>

          <form className="admin-form" onSubmit={save}>
            <div>
              <label className="admin-label">Staff</label>
              <select className="admin-select" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                <option value="">Select staff...</option>
                {staff.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-2col">
              <div>
                <label className="admin-label">Date</label>
                <input className="admin-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div />
            </div>

            <div className="admin-form-2col">
              <div>
                <label className="admin-label">Check-in (HH:MM)</label>
                <input className="admin-input" type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
              </div>
              <div>
                <label className="admin-label">Check-out (HH:MM)</label>
                <input className="admin-input" type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="admin-label">Notes</label>
              <input className="admin-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
            </div>

            <div className="admin-modal-actions" style={{ justifyContent: "flex-start" }}>
              <button type="submit" className="admin-btn-primary" disabled={!staffId}>
                Save
              </button>
            </div>
          </form>
        </div>

        <div className="admin-surface">
          <div className="admin-surface-head">
            <h3 className="admin-surface-title">History</h3>
            <p className="admin-surface-subtitle">Latest 50 records for selected staff.</p>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x._id}>
                    <td style={{ fontWeight: 900 }}>{new Date(x.date).toLocaleDateString()}</td>
                    <td className="admin-muted">{x.checkInTime ? new Date(x.checkInTime).toLocaleTimeString() : "-"}</td>
                    <td className="admin-muted">{x.checkOutTime ? new Date(x.checkOutTime).toLocaleTimeString() : "-"}</td>
                    <td className="admin-muted">{x.notes || "-"}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="admin-empty-cell">
                      {staffId ? "No attendance records." : "Select a staff member."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRAttendancePage;


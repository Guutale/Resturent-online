import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const HRRolesAssignmentsPage = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiRequest("/staff?limit=500")
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Roles / Assignments</h1>
          <p className="admin-subtitle">Review staff roles, shift windows, and current assignment status.</p>
        </div>
      </div>

      <div className="admin-surface">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-striped">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Role</th>
                <th>Shift</th>
                <th>Employment</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div style={{ fontWeight: 900 }}>{item.name}</div>
                    <div className="admin-muted">{item.email}</div>
                  </td>
                  <td><span className={`badge role-${item.role}`}>{item.role}</span></td>
                  <td className="admin-muted">{item.staff?.timeIn || "--"} - {item.staff?.timeOut || "--"}</td>
                  <td><span className={`badge ${item.staff?.employmentStatus === "active" ? "delivered" : "cancelled"}`}>{item.staff?.employmentStatus || "active"}</span></td>
                  <td className="admin-muted">{item.staff?.availabilityStatus || "-"}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty-cell">No staff assignments available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HRRolesAssignmentsPage;

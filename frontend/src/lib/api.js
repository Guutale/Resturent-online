const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${API_BASE}${normalizedPath}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
};
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[ch]));

export const openInvoice = async (orderId) => {
  const id = String(orderId || "").trim();
  if (!id) throw new Error("Missing order id");

  // Try to open a new tab synchronously (best UX). If popup is blocked, we will fall back to same-tab navigation.
  let win = null;
  try {
    win = window.open("", "_blank");
    if (win) win.opener = null;
  } catch {
    win = null;
  }

  if (win) {
    win.document.open();
    win.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice</title>
  </head>
  <body style="font-family:system-ui,Segoe UI,Arial,sans-serif;padding:16px;color:#111827;">
    <div style="font-weight:900;">Loading invoice...</div>
    <div style="color:#6b7280;margin-top:8px;">If nothing happens, check popup blocking settings.</div>
  </body>
</html>`);
    win.document.close();
  }

  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/invoice`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const text = await res.text();

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = JSON.parse(text);
      if (data?.message) message = data.message;
    } catch {}

    if (win) {
      win.document.open();
      win.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice Error</title>
  </head>
  <body style="font-family:system-ui,Segoe UI,Arial,sans-serif;padding:16px;color:#111827;">
    <h2 style="margin:0 0 8px;">Could not load invoice</h2>
    <div style="color:#b91c1c;font-weight:800;">${escapeHtml(message)}</div>
  </body>
</html>`);
      win.document.close();
    }
    throw new Error(message);
  }

  if (win) {
    win.document.open();
    win.document.write(text);
    win.document.close();
    return;
  }

  // Popup blocked fallback: navigate the current tab to a local blob invoice.
  const blob = new Blob([text], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.location.assign(url);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

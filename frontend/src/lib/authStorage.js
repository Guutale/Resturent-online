const getActiveStorage = () => {
  if (localStorage.getItem("token") || localStorage.getItem("user")) return localStorage;
  if (sessionStorage.getItem("token") || sessionStorage.getItem("user")) return sessionStorage;
  return localStorage;
};

export const getStoredAuthToken = () => localStorage.getItem("token") || sessionStorage.getItem("token") || "";

export const getStoredUser = () => {
  const raw = localStorage.getItem("user") || sessionStorage.getItem("user") || "null";
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredAuth = (payload, { remember = true } = {}) => {
  const primary = remember ? localStorage : sessionStorage;
  const secondary = remember ? sessionStorage : localStorage;

  secondary.removeItem("token");
  secondary.removeItem("user");

  primary.setItem("token", payload.token);
  primary.setItem("user", JSON.stringify(payload.user));
};

export const setStoredUser = (user) => {
  const storage = getActiveStorage();
  if (user) storage.setItem("user", JSON.stringify(user));
  else {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
  }
};

export const clearStoredAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
};

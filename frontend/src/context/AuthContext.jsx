import React, { createContext, useContext, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, _setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const setUser = (nextUser) => {
    if (nextUser) localStorage.setItem("user", JSON.stringify(nextUser));
    else localStorage.removeItem("user");
    _setUser(nextUser);
  };

  const setAuth = (payload) => {
    localStorage.setItem("token", payload.token);
    setUser(payload.user);
  };

  const login = async (email, password) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAuth(data);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setAuth(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = useMemo(() => ({ user, setUser, login, register, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

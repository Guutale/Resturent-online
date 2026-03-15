import React, { createContext, useContext, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import { clearStoredAuth, getStoredUser, setStoredAuth, setStoredUser } from "../lib/authStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, _setUser] = useState(() => getStoredUser());

  const setUser = (nextUser) => {
    setStoredUser(nextUser);
    _setUser(nextUser);
  };

  const setAuth = (payload, { remember = true } = {}) => {
    setStoredAuth(payload, { remember });
    _setUser(payload.user);
  };

  const login = async (email, password, remember = true) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAuth(data, { remember });
    return data;
  };

  const register = async (name, email, password, phone = "") => {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone }),
    });
    setAuth(data, { remember: true });
    return data;
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  const value = useMemo(() => ({ user, setUser, login, register, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

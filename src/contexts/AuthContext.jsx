import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI, campusHubAPI } from "../services/api";
import Loader from "../components/common/Loader";
import { useQueryClient } from "@tanstack/react-query";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem("user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("token"),
  );
  const queryClient = useQueryClient();

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await authAPI.getCurrentUser();
      const userData = response.data.user;

      // Enhance user object with isProvider if they have an approved app but their role is not set to 'provider' (e.g. they are a class_rep)
      if (userData.role !== "provider") {
        try {
          const appRes = await campusHubAPI.getMyApplication();
          if (appRes.data?.data?.status === "approved") {
            userData.isProvider = true;
          }
        } catch (e) {
          // safely ignore if not found
        }
      }

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setIsAuthenticated(true);
    } catch (error) {
      // Don't log out if the request was cancelled (e.g. due to strict mode double-invocation)
      if (error.code === "ERR_CANCELED") {
        return;
      }

      // Only clear session on explicit 401 Unauthorized.
      // Network errors, timeouts, server cold-starts, etc. should NOT log the user out.
      // This is especially important for PWA offline-first behaviour.
      const status = error.response?.status;
      if (status === 401) {
        console.warn("Auth check failed (401) — clearing session.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
        queryClient.clear();
      } else {
        // Network/server error: restore user from localStorage cache so PWA stays logged in
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
            setIsAuthenticated(true);
          } catch (_) {
            // corrupted cache — clear silently
            localStorage.removeItem("user");
          }
        }
        console.warn(
          "Auth check network error — using cached session:",
          error.message,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem("token", token);

      if (userData.role !== "provider") {
        try {
          const appRes = await campusHubAPI.getMyApplication();
          if (appRes.data?.data?.status === "approved") {
            userData.isProvider = true;
          }
        } catch (e) {
          // ignore
        }
      }

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      queryClient.clear();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      setIsAuthenticated(true);
      queryClient.clear();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errors: error.response?.data?.errors || [],
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-white flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

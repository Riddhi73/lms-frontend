"use client";

import { createContext, useContext, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jwt") || null;
    }
    return null;
  });

  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

  const register = async (username, email, password, user_type) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/local/register`, {
        username,
        email,
        password,
        user_type,
      });

      const { jwt, user: userData } = response.data;
      setToken(jwt);
      setUser(userData);
      // Store in localStorage AND cookies (for middleware)
      localStorage.setItem("jwt", jwt);
      localStorage.setItem("user", JSON.stringify(userData));
      Cookies.set("jwt", jwt);
      Cookies.set("user_type", userData.user_type);

      return { success: true, user: userData };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.response?.data?.error?.message || "Registration failed",
      };
    }
  };

  const login = async (identifier, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/local`, {
        identifier,
        password,
      });

      const { jwt, user: userData } = response.data;
      setToken(jwt);
      setUser(userData);
      localStorage.setItem("jwt", jwt);
      localStorage.setItem("user", JSON.stringify(userData));
      Cookies.set("jwt", jwt);
      Cookies.set("user_type", userData.user_type);

      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.error?.message || "Login failed",
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    Cookies.remove("jwt");
    Cookies.remove("user_type");
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        register,
        login,
        logout,
        isAuthenticated: !!token,
        userType: user?.user_type || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

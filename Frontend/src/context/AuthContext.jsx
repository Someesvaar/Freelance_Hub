import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { Navigate, Outlet } from "react-router-dom";

// axios base
// Configure axios base URL. 
// It's recommended to use an environment variable for this.
// Example: axios.defaults.baseURL = process.env.REACT_APP_API_URL;
axios.defaults.baseURL = "http://127.0.0.1:5000/api"; // Replace with your API's base URL

// Context
const AuthContext = createContext(undefined); // use undefined so we can detect missing provider

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Sync axios Authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // verify token & fetch profile
      axios
        .get("/user/profile")
        .then((res) => setUser(res.data))
        .catch(() => {
          // invalid token => clear everything
          setToken(null);
          setUser(null);
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
        })
        .finally(() => setLoading(false));
    } else {
      // ensure header is cleaned up
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post("/auth/login", { email, password });
      // adjust field names if your backend uses different keys
      const { access_token, user: userFromResponse } = response.data;
      if (!access_token) throw new Error("No access token in response");
      
      // Set user and token immediately from login response
      setUser(userFromResponse);
      setToken(access_token);
      localStorage.setItem("token", access_token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      
      return true;
    } catch (err) {
      console.error("Login failed", err.response?.data || err.message);
      return false;
    }
  };

  const register = async (username, email, password, is_freelancer) => {
    try {
      await axios.post("/auth/register", { username, email, password, is_freelancer });
      return true;
    } catch (err) {
      console.error("Registration failed", err.response?.data || err.message);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
  };

  const value = {
    user,
    setUser,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// useAuth will throw if used outside the provider — much clearer developer error
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider. Wrap your app with <AuthProvider>.");
  }
  return ctx;
};

// Protected route wrapper uses loading to avoid redirect while validating
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Checking authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

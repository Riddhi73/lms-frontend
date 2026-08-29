import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔥 Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.warn("Permission denied:", error.response?.data?.error?.message);
      // Redirect to dashboard if unauthorized
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
      }
    }
    return Promise.reject(error);
  },
);

// 🔥 Always send JWT if logged in (except for public endpoints)
axiosInstance.interceptors.request.use(
  (config) => {
    // Skip auth for public endpoints (login, signup)
    const publicEndpoints = ["/api/auth/local", "/api/auth/local/register"];
    if (publicEndpoints.some((path) => config.url?.startsWith(path))) {
      return config;
    }

    const token = localStorage.getItem("jwt");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default axiosInstance;

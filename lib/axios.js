import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

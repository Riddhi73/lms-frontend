import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    // 🔥 Use API token instead of JWT for enrollments
    Authorization: `Bearer ${API_TOKEN}`,
  },
});

// Keep the interceptor for regular auth (optional)
axiosInstance.interceptors.request.use(
  (config) => {
    // For endpoints that need user-specific auth
    if (config.useAuth) {
      const token = localStorage.getItem("jwt");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default axiosInstance;

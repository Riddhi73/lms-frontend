import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔥 Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if it's a 403 and the request was for a protected page/action
    if (error.response?.status === 403) {
      console.warn(
        "🔒 Permission denied:",
        error.response?.data?.error?.message,
      );

      // 🔥 CRITICAL FIX: ONLY redirect for non-GET requests or specific URLs
      // Don't redirect for fetching public courses or lessons
      const url = error.config?.url || "";
      const isPublicDataFetch =
        url.includes("/api/courses") ||
        url.includes("/api/lessons") ||
        url.includes("/api/blog-posts");

      // Only redirect if it's NOT a public GET request
      if (!isPublicDataFetch && typeof window !== "undefined") {
        window.location.href = "/dashboard";
      }
    }

    // 🔥 Handle 401 Unauthorized (expired token) - redirect to login
    if (error.response?.status === 401) {
      console.warn("⏰ Session expired. Redirecting to login.");
      localStorage.removeItem("jwt");
      localStorage.removeItem("user");
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  },
);

// 🔥 Request interceptor for adding JWT
axiosInstance.interceptors.request.use(
  (config) => {
    const publicEndpoints = [
      "/api/auth/local",
      "/api/auth/local/register",
      "/api/courses",
      "/api/lessons",
      "/api/blog-posts",
    ];

    // Skip auth for public GET endpoints
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

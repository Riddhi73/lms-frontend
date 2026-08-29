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
    if (error.response?.status === 403) {
      console.warn(
        "🔒 Permission denied:",
        error.response?.data?.error?.message,
      );

      const url = error.config?.url || "";
      // 🔥 Don't redirect for public GET requests (courses, lessons, blog)
      const isPublicDataFetch =
        url.includes("/api/courses") ||
        url.includes("/api/lessons") ||
        url.includes("/api/blog-posts") ||
        url.includes("/api/enrollments");

      // Only redirect if it's NOT a public GET request
      if (!isPublicDataFetch && typeof window !== "undefined") {
        window.location.href = "/dashboard";
      }
    }

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
    // 🔥 Only skip auth for login and register
    const authEndpoints = ["/api/auth/local", "/api/auth/local/register"];
    if (authEndpoints.some((path) => config.url?.startsWith(path))) {
      return config;
    }

    // 🔥 For GET requests to public data (courses, lessons, blog), skip auth
    const publicDataEndpoints = [
      "/api/courses",
      "/api/lessons",
      "/api/blog-posts",
    ];
    if (
      config.method?.toLowerCase() === "get" &&
      publicDataEndpoints.some((path) => config.url?.startsWith(path))
    ) {
      return config;
    }

    // 🔥 For all other requests (POST, PUT, DELETE), send the JWT
    const token = localStorage.getItem("jwt");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default axiosInstance;

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔥 Request interceptor for adding JWT
axiosInstance.interceptors.request.use(
  (config) => {
    // Skip auth for login and register
    const authEndpoints = ["/api/auth/local", "/api/auth/local/register"];
    if (authEndpoints.some((path) => config.url?.startsWith(path))) {
      return config;
    }

    // For GET requests to public data, skip auth
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

    // For all other requests (POST, PUT, DELETE), send the JWT
    const token = localStorage.getItem("jwt");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default axiosInstance;

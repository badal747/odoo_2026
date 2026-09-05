import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage if available
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("peoplepay_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle session expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      if (!window.location.pathname.startsWith("/login")) {
        localStorage.removeItem("peoplepay_token");
        localStorage.removeItem("peoplepay_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

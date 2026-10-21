import axios from "axios";
import { clearSession } from "../utils/auth";
import { ROUTES } from "../types/routes";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/seat-booking-application/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// expired / invalid token on a protected call -> back to the right login page
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const isLoginCall = url.endsWith("/login");

      if (!isLoginCall && localStorage.getItem("token")) {
        const loginPath = ROUTES.LOGIN;
        clearSession();
        window.location.assign(loginPath);
      }
    }
    return Promise.reject(error);
  },
);

export default api;

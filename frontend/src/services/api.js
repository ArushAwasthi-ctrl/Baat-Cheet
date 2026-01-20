import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9990";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Public endpoints that should NOT trigger token refresh
const publicEndpoints = [
  "/auth/register",
  "/auth/login",
  "/auth/verify-otp",
  "/auth/resend-verify-otp",
  "/auth/forgotpassword",
  "/auth/verify-forgotpassword-otp",
];

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if this is a public endpoint - don't retry with refresh
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint)
    );

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If it's a public endpoint or refresh request, don't retry
      if (isPublicEndpoint || originalRequest.url?.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

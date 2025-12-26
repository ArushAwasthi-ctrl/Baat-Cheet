import api from "./api";

const authService = {
  register: (data) => api.post("/api/auth/register", data),

  verifyOtp: (data) => api.post("/api/auth/verify-otp", data),

  resendOtp: (data) => api.post("/api/auth/resend-verify-otp", data),

  login: (data) => api.post("/api/auth/login", data),

  logout: () => api.get("/api/auth/logout"),

  forgotPassword: (data) => api.post("/api/auth/forgotpassword", data),

  resetPassword: (data) => api.post("/api/auth/verify-forgotpassword-otp", data),

  getCurrentUser: () => api.get("/api/users/me"),

  refreshToken: () => api.post("/api/auth/refresh"),
};

export default authService;

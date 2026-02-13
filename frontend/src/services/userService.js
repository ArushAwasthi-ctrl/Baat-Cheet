import api from "./api";

const userService = {
  // Get current logged-in user
  getCurrentUser: async () => {
    const response = await api.get("/api/users/me");
    return response.data;
  },

  // Search users (with cursor pagination)
  searchUsers: async (search = "", cursor = null, limit = 20) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (cursor) params.append("cursor", cursor);
    params.append("limit", limit);
    const response = await api.get(`/api/users?${params.toString()}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },

  // Update profile
  updateProfile: async ({ username, bio, avatar }) => {
    const response = await api.put("/api/users/profile", {
      username,
      bio,
      avatar,
    });
    return response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await api.delete("/api/users/me");
    return response.data;
  },

  // Block a user
  blockUser: async (userId) => {
    const response = await api.post(`/api/users/block/${userId}`);
    return response.data;
  },

  // Unblock a user
  unblockUser: async (userId) => {
    const response = await api.delete(`/api/users/block/${userId}`);
    return response.data;
  },

  // Get blocked users
  getBlockedUsers: async () => {
    const response = await api.get("/api/users/blocked");
    return response.data;
  },
};

export default userService;

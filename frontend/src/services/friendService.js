import api from "./api";

const friendService = {
  // Send a friend request
  sendRequest: async (userId) => {
    const response = await api.post("/api/friends/request", { userId });
    return response.data;
  },

  // Get received friend requests
  getReceivedRequests: async (cursor = null, limit = 20) => {
    const params = new URLSearchParams();
    params.append("limit", limit);
    if (cursor) params.append("cursor", cursor);
    const response = await api.get(`/api/friends/requests/received?${params}`);
    return response.data;
  },

  // Get sent friend requests
  getSentRequests: async (cursor = null, limit = 20) => {
    const params = new URLSearchParams();
    params.append("limit", limit);
    if (cursor) params.append("cursor", cursor);
    const response = await api.get(`/api/friends/requests/sent?${params}`);
    return response.data;
  },

  // Accept a friend request
  acceptRequest: async (requestId) => {
    const response = await api.post(`/api/friends/accept/${requestId}`);
    return response.data;
  },

  // Reject a friend request
  rejectRequest: async (requestId) => {
    const response = await api.post(`/api/friends/reject/${requestId}`);
    return response.data;
  },

  // Remove a friend
  removeFriend: async (userId) => {
    const response = await api.delete(`/api/friends/${userId}`);
    return response.data;
  },

  // Get friends list
  getFriends: async (cursor = null, limit = 20) => {
    const params = new URLSearchParams();
    params.append("limit", limit);
    if (cursor) params.append("cursor", cursor);
    const response = await api.get(`/api/friends?${params}`);
    return response.data;
  },
};

export default friendService;

import api from "./api";

const chatService = {
  // Get all chats for current user (with pagination)
  getUserChats: async (cursor = null, limit = 20) => {
    const params = new URLSearchParams();
    params.append("limit", limit);
    if (cursor) {
      params.append("cursor", cursor);
    }
    const response = await api.get(`/api/chats?${params.toString()}`);
    return response.data;
  },

  // Get a single chat by ID
  getChatById: async (chatId) => {
    const response = await api.get(`/api/chats/${chatId}`);
    return response.data;
  },

  // Create or get direct chat with a user
  createOrGetDirectChat: async (userId) => {
    const response = await api.post("/api/chats", { userId });
    return response.data;
  },

  // Create a group chat
  createGroupChat: async ({ name, description, participants }) => {
    const response = await api.post("/api/chats/group", {
      name,
      description,
      participants,
    });
    return response.data;
  },

  // Update group info (name, description)
  updateGroupInfo: async (chatId, { name, description }) => {
    const response = await api.post(`/api/chats/${chatId}`, {
      name,
      description,
    });
    return response.data;
  },

  // Add members to a group chat
  addMembers: async (chatId, memberIds) => {
    const response = await api.post(`/api/chats/${chatId}/members/add`, {
      memberIds,
    });
    return response.data;
  },

  // Remove members from a group chat
  removeMembers: async (chatId, memberIds) => {
    const response = await api.post(`/api/chats/${chatId}/members/remove`, {
      memberIds,
    });
    return response.data;
  },

  // Promote member to admin
  promoteToAdmin: async (chatId, memberId) => {
    const response = await api.post(`/api/chats/${chatId}/members/promote`, {
      memberId,
    });
    return response.data;
  },

  // Leave a group chat
  leaveGroup: async (chatId) => {
    const response = await api.post(`/api/chats/${chatId}/leave`);
    return response.data;
  },

  // Delete a chat
  deleteChat: async (chatId) => {
    const response = await api.delete(`/api/chats/${chatId}`);
    return response.data;
  },
};

export default chatService;

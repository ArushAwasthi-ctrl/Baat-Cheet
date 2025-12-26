import api from "./api";

const messageService = {
  // Send a message to a chat
  sendMessage: async (chatId, { content, type = "text", attachments = [] }) => {
    const response = await api.post("/api/messages", {
      chatId,
      content,
      type,
      attachments,
    });
    return response.data;
  },

  // Get messages for a chat (with cursor pagination)
  getMessages: async (chatId, cursor = null, limit = 50) => {
    const params = new URLSearchParams();
    params.append("limit", limit);
    if (cursor) {
      params.append("cursor", cursor);
    }
    const response = await api.get(`/api/messages/${chatId}?${params.toString()}`);
    return response.data;
  },

  // Mark messages as read in a chat
  markAsRead: async (chatId) => {
    const response = await api.post(`/api/messages/${chatId}/mark-read`);
    return response.data;
  },
};

export default messageService;

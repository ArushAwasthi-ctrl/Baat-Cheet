import api from "./api";

const messageService = {
  // Send a message to a chat (supports file uploads and replies)
  sendMessage: async (chatId, { content, type = "text", attachments = [], files = [], replyTo = null }) => {
    // Use FormData if files are being uploaded
    if (files.length > 0) {
      const formData = new FormData();
      formData.append("chatId", chatId);
      if (content) formData.append("content", content);
      if (replyTo) formData.append("replyTo", replyTo);
      files.forEach((file) => formData.append("files", file));

      const response = await api.post("/api/messages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }

    const response = await api.post("/api/messages", {
      chatId,
      content,
      type,
      attachments,
      replyTo,
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

  // Edit a message
  editMessage: async (messageId, content) => {
    const response = await api.put(`/api/messages/${messageId}`, { content });
    return response.data;
  },

  // Delete a message (soft delete)
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/api/messages/${messageId}`);
    return response.data;
  },

  // Toggle reaction on a message
  toggleReaction: async (messageId, emoji) => {
    const response = await api.post(`/api/messages/${messageId}/react`, { emoji });
    return response.data;
  },

  // Search messages in a specific chat
  searchInChat: async (chatId, query, cursor = null, limit = 20) => {
    const params = new URLSearchParams({ q: query, limit });
    if (cursor) params.append("cursor", cursor);
    const response = await api.get(`/api/messages/${chatId}/search?${params}`);
    return response.data;
  },

  // Global search across all chats
  searchGlobal: async (query, cursor = null, limit = 20) => {
    const params = new URLSearchParams({ q: query, limit });
    if (cursor) params.append("cursor", cursor);
    const response = await api.get(`/api/messages/search?${params}`);
    return response.data;
  },
};

export default messageService;

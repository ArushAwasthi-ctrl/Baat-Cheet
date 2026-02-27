import api from "./api";

const aiService = {
  requestSummary: async (chatId) => {
    const response = await api.post("/api/ai/summary", { chatId });
    return response.data;
  },
};

export default aiService;

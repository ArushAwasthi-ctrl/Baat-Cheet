import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import aiService from "../../services/aiService";

export const requestSummary = createAsyncThunk(
  "ai/requestSummary",
  async ({ chatId }, { rejectWithValue }) => {
    try {
      const response = await aiService.requestSummary(chatId);
      return { chatId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message ||
          error.message ||
          "Failed to request summary",
      );
    }
  },
);

const aiSlice = createSlice({
  name: "ai",
  initialState: {
    summariesByChat: {}, // chatId → final summary text
    streamingByChat: {}, // chatId → streaming text being built
    aiTypingByChat: {}, // chatId → boolean
    aiStreamByChat: {}, // chatId → AI response streaming text
    isRequestingSummary: false,
    error: null,
  },
  reducers: {
    // Summary streaming
    appendSummaryChunk: (state, action) => {
      const { chatId, chunk } = action.payload;
      if (!state.streamingByChat[chatId]) {
        state.streamingByChat[chatId] = "";
      }
      state.streamingByChat[chatId] += chunk;
    },
    completeSummary: (state, action) => {
      const { chatId, summary } = action.payload;
      state.summariesByChat[chatId] = summary;
      delete state.streamingByChat[chatId];
    },
    clearSummary: (state, action) => {
      const chatId = action.payload;
      delete state.summariesByChat[chatId];
      delete state.streamingByChat[chatId];
    },
    setSummaryError: (state, action) => {
      const { chatId, error } = action.payload;
      state.error = error;
      delete state.streamingByChat[chatId];
    },

    // AI chat streaming
    setAiTyping: (state, action) => {
      const { chatId, isTyping } = action.payload;
      state.aiTypingByChat[chatId] = isTyping;
    },
    appendAiChatChunk: (state, action) => {
      const { chatId, fullText } = action.payload;
      state.aiStreamByChat[chatId] = fullText;
    },
    completeAiChat: (state, action) => {
      const { chatId } = action.payload;
      delete state.aiStreamByChat[chatId];
      delete state.aiTypingByChat[chatId];
    },
    setAiChatError: (state, action) => {
      const { chatId } = action.payload;
      delete state.aiStreamByChat[chatId];
      delete state.aiTypingByChat[chatId];
    },
    clearAiState: () => ({
      summariesByChat: {},
      streamingByChat: {},
      aiTypingByChat: {},
      aiStreamByChat: {},
      isRequestingSummary: false,
      error: null,
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestSummary.pending, (state) => {
        state.isRequestingSummary = true;
        state.error = null;
      })
      .addCase(requestSummary.fulfilled, (state, action) => {
        state.isRequestingSummary = false;
        if (action.payload.summary) {
          state.summariesByChat[action.payload.chatId] = action.payload.summary;
        }
      })
      .addCase(requestSummary.rejected, (state, action) => {
        state.isRequestingSummary = false;
        state.error = action.payload;
      });
  },
});

export const {
  appendSummaryChunk,
  completeSummary,
  clearSummary,
  setSummaryError,
  setAiTyping,
  appendAiChatChunk,
  completeAiChat,
  setAiChatError,
  clearAiState,
} = aiSlice.actions;

export default aiSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import messageService from "../../services/messageService";

// Helper to extract error message
const getErrorMessage = (error, fallback) => {
  return (
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    error.message ||
    fallback
  );
};

// Async Thunks
export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async ({ chatId, cursor = null, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await messageService.getMessages(chatId, cursor, limit);
      return { chatId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch messages")
      );
    }
  }
);

export const sendMessage = createAsyncThunk(
  "messages/sendMessage",
  async (
    { chatId, content, type = "text", attachments = [], files = [], replyTo = null },
    { rejectWithValue }
  ) => {
    try {
      const response = await messageService.sendMessage(chatId, {
        content,
        type,
        attachments,
        files,
        replyTo,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to send message"));
    }
  }
);

export const editMessage = createAsyncThunk(
  "messages/editMessage",
  async ({ messageId, content }, { rejectWithValue }) => {
    try {
      const response = await messageService.editMessage(messageId, content);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to edit message"));
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "messages/deleteMessage",
  async ({ messageId }, { rejectWithValue }) => {
    try {
      await messageService.deleteMessage(messageId);
      return { messageId };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to delete message")
      );
    }
  }
);

export const toggleReaction = createAsyncThunk(
  "messages/toggleReaction",
  async ({ messageId, emoji }, { rejectWithValue }) => {
    try {
      const response = await messageService.toggleReaction(messageId, emoji);
      return { messageId, reactions: response.data.reactions };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to toggle reaction")
      );
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  "messages/markAsRead",
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await messageService.markAsRead(chatId);
      return { chatId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to mark messages as read")
      );
    }
  }
);

const initialState = {
  // Messages organized by chatId
  messagesByChat: {},
  // Loading states per chat
  loadingByChat: {},
  // Pagination info per chat
  paginationByChat: {},
  // Sending message state
  isSending: false,
  sendError: null,
  // General error
  error: null,
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    clearMessages: (state, action) => {
      const chatId = action.payload;
      if (chatId) {
        delete state.messagesByChat[chatId];
        delete state.loadingByChat[chatId];
        delete state.paginationByChat[chatId];
      } else {
        state.messagesByChat = {};
        state.loadingByChat = {};
        state.paginationByChat = {};
      }
    },
    clearError: (state) => {
      state.error = null;
      state.sendError = null;
    },
    // Add a message in real-time (from socket)
    addMessage: (state, action) => {
      const { chatId, message } = action.payload;
      if (!state.messagesByChat[chatId]) {
        state.messagesByChat[chatId] = [];
      }
      // Avoid duplicates
      const exists = state.messagesByChat[chatId].some(
        (m) => m._id === message._id
      );
      if (!exists) {
        state.messagesByChat[chatId].push(message);
      }
    },
    // Update message status (for delivery/read receipts)
    updateMessageStatus: (state, action) => {
      const { chatId, messageId, status } = action.payload;
      const messages = state.messagesByChat[chatId];
      if (messages) {
        const message = messages.find((m) => m._id === messageId);
        if (message) {
          message.status = status;
        }
      }
    },
    // Mark all messages in a chat as read
    markChatMessagesAsRead: (state, action) => {
      const { chatId } = action.payload;
      const messages = state.messagesByChat[chatId];
      if (messages) {
        messages.forEach((m) => {
          if (m.status !== "read") {
            m.status = "read";
          }
        });
      }
    },
    // Add optimistic message (before server confirms)
    addOptimisticMessage: (state, action) => {
      const { chatId, message } = action.payload;
      if (!state.messagesByChat[chatId]) {
        state.messagesByChat[chatId] = [];
      }
      state.messagesByChat[chatId].push(message);
    },
    // Replace optimistic message with server response
    replaceOptimisticMessage: (state, action) => {
      const { chatId, tempId, message } = action.payload;
      const messages = state.messagesByChat[chatId];
      if (messages) {
        const index = messages.findIndex((m) => m._id === tempId);
        if (index !== -1) {
          messages[index] = message;
        }
      }
    },
    // Remove failed optimistic message
    removeOptimisticMessage: (state, action) => {
      const { chatId, tempId } = action.payload;
      const messages = state.messagesByChat[chatId];
      if (messages) {
        state.messagesByChat[chatId] = messages.filter((m) => m._id !== tempId);
      }
    },
    // Real-time: message edited by another user (from socket)
    updateEditedMessage: (state, action) => {
      const { chatId, messageId, content, isEdited, editedAt } = action.payload;
      const messages = state.messagesByChat[chatId];
      if (messages) {
        const msg = messages.find((m) => m._id === messageId);
        if (msg) {
          msg.content = content;
          msg.isEdited = isEdited;
          msg.editedAt = editedAt;
        }
      }
    },
    // Real-time: message deleted by another user (from socket)
    updateDeletedMessage: (state, action) => {
      const { chatId, messageId } = action.payload;
      const messages = state.messagesByChat[chatId];
      if (messages) {
        const msg = messages.find((m) => m._id === messageId);
        if (msg) {
          msg.isDeleted = true;
          msg.content = "This message was deleted";
          msg.attachments = [];
        }
      }
    },
    // Real-time: reaction toggled (from socket)
    updateReactions: (state, action) => {
      const { chatId, messageId, reactions } = action.payload;
      const messages = state.messagesByChat[chatId];
      if (messages) {
        const msg = messages.find((m) => m._id === messageId);
        if (msg) {
          msg.reactions = reactions;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Messages
      .addCase(fetchMessages.pending, (state, action) => {
        const chatId = action.meta.arg.chatId;
        state.loadingByChat[chatId] = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { chatId, messages, nextCursor, hasMore } = action.payload;
        state.loadingByChat[chatId] = false;

        // If cursor is provided, prepend older messages
        if (action.meta.arg.cursor) {
          state.messagesByChat[chatId] = [
            ...messages,
            ...(state.messagesByChat[chatId] || []),
          ];
        } else {
          // Initial load - messages come in chronological order from API
          state.messagesByChat[chatId] = messages;
        }

        state.paginationByChat[chatId] = { nextCursor, hasMore };
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        const chatId = action.meta.arg.chatId;
        state.loadingByChat[chatId] = false;
        state.error = action.payload;
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
        state.sendError = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        const message = action.payload.message;
        const chatId = message.chat;

        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }

        // Avoid duplicates (in case optimistic update was used)
        const exists = state.messagesByChat[chatId].some(
          (m) => m._id === message._id
        );
        if (!exists) {
          state.messagesByChat[chatId].push(message);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.sendError = action.payload;
      })
      // Mark as Read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { chatId } = action.payload;
        const messages = state.messagesByChat[chatId];
        if (messages) {
          messages.forEach((m) => {
            m.status = "read";
          });
        }
      })
      // Edit Message
      .addCase(editMessage.fulfilled, (state, action) => {
        const msg = action.payload.message;
        const chatId = msg.chat?.toString?.() || msg.chat;
        const messages = state.messagesByChat[chatId];
        if (messages) {
          const index = messages.findIndex((m) => m._id === msg._id);
          if (index !== -1) {
            messages[index] = { ...messages[index], ...msg };
          }
        }
      })
      // Delete Message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { messageId } = action.payload;
        // Find the message across all chats and soft-delete it
        for (const chatId of Object.keys(state.messagesByChat)) {
          const messages = state.messagesByChat[chatId];
          const msg = messages?.find((m) => m._id === messageId);
          if (msg) {
            msg.isDeleted = true;
            msg.content = "This message was deleted";
            msg.attachments = [];
            break;
          }
        }
      })
      // Toggle Reaction
      .addCase(toggleReaction.fulfilled, (state, action) => {
        const { messageId, reactions } = action.payload;
        for (const chatId of Object.keys(state.messagesByChat)) {
          const messages = state.messagesByChat[chatId];
          const msg = messages?.find((m) => m._id === messageId);
          if (msg) {
            msg.reactions = reactions;
            break;
          }
        }
      });
  },
});

export const {
  clearMessages,
  clearError,
  addMessage,
  updateMessageStatus,
  markChatMessagesAsRead,
  addOptimisticMessage,
  replaceOptimisticMessage,
  removeOptimisticMessage,
  updateEditedMessage,
  updateDeletedMessage,
  updateReactions,
} = messageSlice.actions;

export default messageSlice.reducer;

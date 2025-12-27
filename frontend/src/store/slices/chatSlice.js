import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import chatService from "../../services/chatService";

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
export const fetchChats = createAsyncThunk(
  "chats/fetchChats",
  async ({ cursor = null, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await chatService.getUserChats(cursor, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch chats"));
    }
  }
);

export const fetchChatById = createAsyncThunk(
  "chats/fetchChatById",
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await chatService.getChatById(chatId);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch chat"));
    }
  }
);

export const createDirectChat = createAsyncThunk(
  "chats/createDirectChat",
  async (participantId, { rejectWithValue }) => {
    try {
      const response = await chatService.createOrGetDirectChat(participantId);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to create chat"));
    }
  }
);

export const createGroupChat = createAsyncThunk(
  "chats/createGroupChat",
  async ({ name, description, participants }, { rejectWithValue }) => {
    try {
      const response = await chatService.createGroupChat({
        name,
        description,
        participants,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to create group chat")
      );
    }
  }
);

export const updateGroupInfo = createAsyncThunk(
  "chats/updateGroupInfo",
  async ({ chatId, name, description }, { rejectWithValue }) => {
    try {
      const response = await chatService.updateGroupInfo(chatId, {
        name,
        description,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update group info")
      );
    }
  }
);

export const addMembersToGroup = createAsyncThunk(
  "chats/addMembers",
  async ({ chatId, memberIds }, { rejectWithValue }) => {
    try {
      const response = await chatService.addMembers(chatId, memberIds);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to add members"));
    }
  }
);

export const removeMembersFromGroup = createAsyncThunk(
  "chats/removeMembers",
  async ({ chatId, memberIds }, { rejectWithValue }) => {
    try {
      const response = await chatService.removeMembers(chatId, memberIds);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to remove members")
      );
    }
  }
);

export const promoteToAdmin = createAsyncThunk(
  "chats/promoteToAdmin",
  async ({ chatId, memberId }, { rejectWithValue }) => {
    try {
      const response = await chatService.promoteToAdmin(chatId, memberId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to promote member")
      );
    }
  }
);

const initialState = {
  chats: [],
  selectedChat: null,
  isLoading: false,
  isFetchingMore: false,
  error: null,
  nextCursor: null,
  hasMore: true,
};

const chatSlice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
    },
    clearSelectedChat: (state) => {
      state.selectedChat = null;
    },
    clearChats: (state) => {
      state.chats = [];
      state.selectedChat = null;
      state.nextCursor = null;
      state.hasMore = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Update chat's last message (for real-time updates)
    updateChatLastMessage: (state, action) => {
      const { chatId, message } = action.payload;
      const chatIndex = state.chats.findIndex((c) => c._id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = message;
        state.chats[chatIndex].updatedAt = message.createdAt;
        // Move chat to top of list
        const [chat] = state.chats.splice(chatIndex, 1);
        state.chats.unshift(chat);
      }
    },
    // Increment unread count (for real-time updates)
    incrementUnreadCount: (state, action) => {
      const { chatId } = action.payload;
      const chat = state.chats.find((c) => c._id === chatId);
      if (chat) {
        chat.unreadCount = (chat.unreadCount || 0) + 1;
      }
    },
    // Reset unread count when chat is opened
    resetUnreadCount: (state, action) => {
      const { chatId } = action.payload;
      const chat = state.chats.find((c) => c._id === chatId);
      if (chat) {
        chat.unreadCount = 0;
      }
    },
    // Add a new chat to the list (for real-time)
    addChat: (state, action) => {
      const newChat = action.payload;
      const exists = state.chats.some((c) => c._id === newChat._id);
      if (!exists) {
        state.chats.unshift(newChat);
      }
    },
    // Remove a chat from the list (when removed from group)
    removeChat: (state, action) => {
      const chatId = action.payload;
      state.chats = state.chats.filter((c) => c._id !== chatId);
      if (state.selectedChat?._id === chatId) {
        state.selectedChat = null;
      }
    },
    // Update a chat in the list (for real-time group updates)
    updateChat: (state, action) => {
      const updatedChat = action.payload;
      const index = state.chats.findIndex((c) => c._id === updatedChat._id);
      if (index !== -1) {
        state.chats[index] = { ...state.chats[index], ...updatedChat };
      }
      if (state.selectedChat?._id === updatedChat._id) {
        state.selectedChat = { ...state.selectedChat, ...updatedChat };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Chats
      .addCase(fetchChats.pending, (state, action) => {
        if (action.meta.arg?.cursor) {
          state.isFetchingMore = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        const { chats, nextCursor, hasMore } = action.payload;
        if (action.meta.arg?.cursor) {
          // Appending more chats
          state.chats = [...state.chats, ...chats];
          state.isFetchingMore = false;
        } else {
          // Initial load
          state.chats = chats;
          state.isLoading = false;
        }
        state.nextCursor = nextCursor;
        state.hasMore = hasMore;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.isFetchingMore = false;
        state.error = action.payload;
      })
      // Fetch Chat By ID
      .addCase(fetchChatById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChatById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedChat = action.payload.chat;
      })
      .addCase(fetchChatById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Direct Chat
      .addCase(createDirectChat.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDirectChat.fulfilled, (state, action) => {
        state.isLoading = false;
        const newChat = action.payload.chat;
        // Add to list if not exists
        const exists = state.chats.some((c) => c._id === newChat._id);
        if (!exists) {
          state.chats.unshift(newChat);
        }
        state.selectedChat = newChat;
      })
      .addCase(createDirectChat.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Group Chat
      .addCase(createGroupChat.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGroupChat.fulfilled, (state, action) => {
        state.isLoading = false;
        const newChat = action.payload.chat;
        state.chats.unshift(newChat);
        state.selectedChat = newChat;
      })
      .addCase(createGroupChat.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Group Info
      .addCase(updateGroupInfo.fulfilled, (state, action) => {
        const updatedChat = action.payload.chat;
        const index = state.chats.findIndex((c) => c._id === updatedChat._id);
        if (index !== -1) {
          state.chats[index] = { ...state.chats[index], ...updatedChat };
        }
        if (state.selectedChat?._id === updatedChat._id) {
          state.selectedChat = { ...state.selectedChat, ...updatedChat };
        }
      })
      // Add Members
      .addCase(addMembersToGroup.fulfilled, (state, action) => {
        const updatedChat = action.payload.chat;
        const index = state.chats.findIndex((c) => c._id === updatedChat._id);
        if (index !== -1) {
          state.chats[index] = updatedChat;
        }
        if (state.selectedChat?._id === updatedChat._id) {
          state.selectedChat = updatedChat;
        }
      })
      // Remove Members
      .addCase(removeMembersFromGroup.fulfilled, (state, action) => {
        const updatedChat = action.payload.chat;
        const index = state.chats.findIndex((c) => c._id === updatedChat._id);
        if (index !== -1) {
          state.chats[index] = updatedChat;
        }
        if (state.selectedChat?._id === updatedChat._id) {
          state.selectedChat = updatedChat;
        }
      })
      // Promote to Admin
      .addCase(promoteToAdmin.fulfilled, (state, action) => {
        const updatedChat = action.payload.chat;
        const index = state.chats.findIndex((c) => c._id === updatedChat._id);
        if (index !== -1) {
          state.chats[index] = updatedChat;
        }
        if (state.selectedChat?._id === updatedChat._id) {
          state.selectedChat = updatedChat;
        }
      });
  },
});

export const {
  setSelectedChat,
  clearSelectedChat,
  clearChats,
  clearError,
  updateChatLastMessage,
  incrementUnreadCount,
  resetUnreadCount,
  addChat,
  removeChat,
  updateChat,
} = chatSlice.actions;

export default chatSlice.reducer;

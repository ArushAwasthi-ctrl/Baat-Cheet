import { io } from "socket.io-client";
import { store } from "../store/store";
import { addMessage, updateMessageStatus } from "../store/slices/messageSlice";
import {
  updateChatLastMessage,
  incrementUnreadCount,
  addChat,
  setSelectedChat,
  removeChat,
  updateChat,
} from "../store/slices/chatSlice";
import authService from "./authService";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isRefreshingToken = false;
  }

  // Initialize socket connection
  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9990";

    this.socket = io(API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
    return this.socket;
  }

  // Handle token refresh and reconnection
  async handleTokenExpiry() {
    if (this.isRefreshingToken) return;

    this.isRefreshingToken = true;
    try {
      await authService.refreshToken();
      // Reconnect socket after token refresh
      if (this.socket) {
        this.socket.disconnect();
        this.socket.connect();
      }
    } catch (error) {
      console.error("Failed to refresh token for socket:", error);
    } finally {
      this.isRefreshingToken = false;
    }
  }

  // Setup all event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      this.reconnectAttempts++;

      // If token expired, try to refresh and reconnect
      if (error.message === "Token expired" || error.message === "Authentication failed") {
        this.handleTokenExpiry();
      }
    });

    // Message events
    this.socket.on("message:new", (data) => {
      const { chatId, message } = data;
      const state = store.getState();
      const currentUserId = state.auth.user?._id;
      const selectedChat = state.chats.selectedChat;

      // Add message to store
      store.dispatch(addMessage({ chatId, message }));

      // Update chat's last message
      store.dispatch(updateChatLastMessage({ chatId, message }));

      // Increment unread count if not viewing this chat
      if (selectedChat?._id !== chatId && message.sender?._id !== currentUserId) {
        store.dispatch(incrementUnreadCount({ chatId }));
      }
    });

    // Chat update events (for sidebar)
    this.socket.on("chat:update", (data) => {
      const { chatId, lastMessage } = data;
      store.dispatch(updateChatLastMessage({ chatId, message: lastMessage }));
    });

    // New chat created (when someone creates a chat with you)
    this.socket.on("chat:new", (data) => {
      const { chat } = data;
      store.dispatch(addChat(chat));
    });

    // Removed from chat
    this.socket.on("chat:removed", (data) => {
      const { chatId } = data;
      store.dispatch(removeChat(chatId));
    });

    // Group updated events
    this.socket.on("group:updated", (data) => {
      const { chat } = data;
      if (chat) {
        store.dispatch(updateChat(chat));
      }
    });

    // Typing indicators
    this.socket.on("typing:start", (data) => {
      // Dispatch typing start event - components can listen to this
      const event = new CustomEvent("user:typing", { detail: data });
      window.dispatchEvent(event);
    });

    this.socket.on("typing:stop", (data) => {
      const event = new CustomEvent("user:stopped-typing", { detail: data });
      window.dispatchEvent(event);
    });

    // Read receipts
    this.socket.on("messages:read", (data) => {
      const { chatId, readBy } = data;
      store.dispatch(updateMessageStatus({ chatId, status: "read" }));
    });

    // User online/offline status
    this.socket.on("user:online", (data) => {
      const event = new CustomEvent("user:status-change", {
        detail: { ...data, status: "online" }
      });
      window.dispatchEvent(event);
    });

    this.socket.on("user:offline", (data) => {
      const event = new CustomEvent("user:status-change", {
        detail: { ...data, status: "offline" }
      });
      window.dispatchEvent(event);
    });
  }

  // Join a chat room
  joinChat(chatId) {
    if (this.socket?.connected) {
      this.socket.emit("chat:join", chatId);
    }
  }

  // Leave a chat room
  leaveChat(chatId) {
    if (this.socket?.connected) {
      this.socket.emit("chat:leave", chatId);
    }
  }

  // Emit typing start
  startTyping(chatId) {
    if (this.socket?.connected) {
      this.socket.emit("typing:start", { chatId });
    }
  }

  // Emit typing stop
  stopTyping(chatId) {
    if (this.socket?.connected) {
      this.socket.emit("typing:stop", { chatId });
    }
  }

  // Emit message read
  markAsRead(chatId, messageId) {
    if (this.socket?.connected) {
      this.socket.emit("message:read", { chatId, messageId });
    }
  }

  // Notify about new chat creation
  notifyNewChat(chat) {
    if (this.socket?.connected) {
      this.socket.emit("chat:created", { chat });
    }
  }

  // Notify about group updates
  notifyGroupUpdate(chatId, chat, action) {
    if (this.socket?.connected) {
      this.socket.emit("group:updated", { chatId, chat, action });
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

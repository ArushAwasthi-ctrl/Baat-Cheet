import { io } from "socket.io-client";
import { store } from "../store/store";
import {
  addMessage,
  updateMessageStatus,
  updateEditedMessage,
  updateDeletedMessage,
  updateReactions,
} from "../store/slices/messageSlice";
import {
  updateChatLastMessage,
  incrementUnreadCount,
  addChat,
  removeChat,
  updateChat,
} from "../store/slices/chatSlice";
import {
  addReceivedRequest,
  friendRequestAccepted,
  friendRemoved,
} from "../store/slices/friendSlice";
import authService from "./authService";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.isRefreshingToken = false;
    this.connectionListeners = new Set();
  }

  // Subscribe to connection state changes
  onConnectionChange(callback) {
    this.connectionListeners.add(callback);
    // Immediately call with current state
    callback(this.isConnected);
    return () => this.connectionListeners.delete(callback);
  }

  // Broadcast connection state changes
  broadcastConnectionState(connected) {
    this.isConnected = connected;
    this.connectionListeners.forEach((cb) => cb(connected));
    // Also dispatch custom event for components
    window.dispatchEvent(
      new CustomEvent("socket:connection-change", { detail: { connected } })
    );
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
      reconnectionDelayMax: 10000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
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
    } catch {
      // Token refresh failed - user will need to re-login
    } finally {
      this.isRefreshingToken = false;
    }
  }

  // Setup all event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      this.broadcastConnectionState(true);
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      this.broadcastConnectionState(false);

      // If server closed connection, attempt reconnect
      if (reason === "io server disconnect") {
        setTimeout(() => this.socket?.connect(), 1000);
      }
    });

    this.socket.on("connect_error", (error) => {
      this.reconnectAttempts++;
      this.broadcastConnectionState(false);

      // If token expired, try to refresh and reconnect
      if (error.message === "Token expired" || error.message === "Authentication failed") {
        this.handleTokenExpiry();
      }
    });

    this.socket.on("reconnect", () => {
      this.broadcastConnectionState(true);
    });

    this.socket.on("reconnect_failed", () => {
      this.broadcastConnectionState(false);
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

    // Message edited
    this.socket.on("message:edited", (data) => {
      store.dispatch(updateEditedMessage(data));
    });

    // Message deleted
    this.socket.on("message:deleted", (data) => {
      store.dispatch(updateDeletedMessage(data));
    });

    // Message reaction toggled
    this.socket.on("message:reacted", (data) => {
      store.dispatch(updateReactions(data));
    });

    // Read receipts
    this.socket.on("messages:read", (data) => {
      const { chatId } = data;
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

    // Friend events
    this.socket.on("friend:request", (data) => {
      store.dispatch(addReceivedRequest(data.request));
    });

    this.socket.on("friend:accepted", (data) => {
      store.dispatch(friendRequestAccepted(data));
    });

    this.socket.on("friend:removed", (data) => {
      store.dispatch(friendRemoved(data));
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

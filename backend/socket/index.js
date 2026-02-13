import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/Users.js";
import Chat from "../models/Chats.js";

// Store active connections: Map<userId, Set<socketId>>
const userSockets = new Map();

// Helper to get user's socket IDs
const getUserSocketIds = (userId) => {
  return userSockets.get(userId.toString()) || new Set();
};

// Helper to emit to specific user (all their connections)
const emitToUser = (io, userId, event, data) => {
  const socketIds = getUserSocketIds(userId);
  socketIds.forEach((socketId) => {
    io.to(socketId).emit(event, data);
  });
};

// Helper to emit to all participants in a chat
const emitToChat = async (io, chatId, event, data, excludeUserId = null) => {
  try {
    const chat = await Chat.findById(chatId).lean();
    if (!chat) return;

    chat.participants.forEach((participantId) => {
      const participantIdStr = participantId.toString();
      if (excludeUserId && participantIdStr === excludeUserId.toString()) {
        return;
      }
      emitToUser(io, participantIdStr, event, data);
    });
  } catch (err) {
    console.error(`[Socket] emitToChat error for chat ${chatId}:`, err);
  }
};

// Socket authentication middleware
const socketAuthMiddleware = async (socket, next) => {
  try {
    // Get token from handshake auth or cookies
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.cookie
        ?.split("; ")
        .find((c) => c.startsWith("accessToken="))
        ?.split("=")[1];

    if (!token) {
      return next(new Error("Authentication required"));
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select("-password").lean();

    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach user to socket
    socket.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new Error("Token expired"));
    }
    next(new Error("Authentication failed"));
  }
};

// Initialize Socket.IO
const initializeSocket = (server) => {
  const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: (origin, cb) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return cb(null, true);

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
          return cb(null, origin);
        }

        // In development, allow all origins
        if (process.env.NODE_ENV !== "production") {
          return cb(null, origin);
        }

        // In production, reject unauthorized origins
        return cb(null, false);
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();

    // Track user's socket connection
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Update user status to online
    await User.findByIdAndUpdate(userId, { status: "online" });

    // Join user to their personal room (for direct notifications)
    socket.join(`user:${userId}`);

    // Join user to all their chat rooms
    try {
      const userChats = await Chat.find({ participants: userId }).select("_id").lean();
      userChats.forEach((chat) => {
        socket.join(`chat:${chat._id}`);
      });
    } catch {
      // Silently fail - user may have no chats yet
    }

    // Broadcast online status to all user's contacts
    socket.broadcast.emit("user:online", {
      userId,
      status: "online",
    });

    // ==================== EVENT HANDLERS ====================

    // Handle joining a specific chat room
    socket.on("chat:join", (chatId) => {
      try {
        socket.join(`chat:${chatId}`);
      } catch (err) {
        console.error(`[Socket] chat:join error for user ${userId}:`, err);
      }
    });

    // Handle leaving a chat room
    socket.on("chat:leave", (chatId) => {
      try {
        socket.leave(`chat:${chatId}`);
      } catch (err) {
        console.error(`[Socket] chat:leave error for user ${userId}:`, err);
      }
    });

    // Handle new message
    socket.on("message:send", async (data) => {
      try {
        const { chatId, message } = data;

        // Emit to all participants in the chat (except sender)
        socket.to(`chat:${chatId}`).emit("message:new", {
          chatId,
          message,
        });

        // Also emit chat update for sidebar
        socket.to(`chat:${chatId}`).emit("chat:update", {
          chatId,
          lastMessage: message,
        });
      } catch (err) {
        console.error(`[Socket] message:send error for user ${userId}:`, err);
      }
    });

    // Handle typing indicator
    socket.on("typing:start", async (data) => {
      try {
        const { chatId } = data;
        socket.to(`chat:${chatId}`).emit("typing:start", {
          chatId,
          userId,
          username: socket.user.username,
        });
      } catch (err) {
        console.error(`[Socket] typing:start error for user ${userId}:`, err);
      }
    });

    socket.on("typing:stop", async (data) => {
      try {
        const { chatId } = data;
        socket.to(`chat:${chatId}`).emit("typing:stop", {
          chatId,
          userId,
        });
      } catch (err) {
        console.error(`[Socket] typing:stop error for user ${userId}:`, err);
      }
    });

    // Handle message read
    socket.on("message:read", async (data) => {
      try {
        const { chatId, messageId } = data;
        socket.to(`chat:${chatId}`).emit("message:read", {
          chatId,
          messageId,
          readBy: userId,
        });
      } catch (err) {
        console.error(`[Socket] message:read error for user ${userId}:`, err);
      }
    });

    // Handle new chat created
    socket.on("chat:created", async (data) => {
      try {
        const { chat } = data;
        // Notify all participants to join the new chat room
        chat.participants.forEach((participantId) => {
          const participantIdStr = participantId._id || participantId;
          emitToUser(io, participantIdStr.toString(), "chat:new", { chat });
        });
      } catch (err) {
        console.error(`[Socket] chat:created error for user ${userId}:`, err);
      }
    });

    // Handle group updates (members added/removed, info changed)
    socket.on("group:updated", async (data) => {
      try {
        const { chatId, chat, action } = data;
        socket.to(`chat:${chatId}`).emit("group:updated", {
          chatId,
          chat,
          action, // 'memberAdded', 'memberRemoved', 'infoUpdated', 'adminPromoted'
        });
      } catch (err) {
        console.error(`[Socket] group:updated error for user ${userId}:`, err);
      }
    });

    // Handle user coming back online (reconnection)
    socket.on("user:active", () => {
      try {
        socket.broadcast.emit("user:online", {
          userId,
          status: "online",
        });
      } catch (err) {
        console.error(`[Socket] user:active error for user ${userId}:`, err);
      }
    });

    // ==================== DISCONNECT HANDLER ====================

    socket.on("disconnect", async () => {
      try {
        // Remove this socket from user's connections
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);

            // Only update status if user has no more active connections
            await User.findByIdAndUpdate(userId, {
              status: "offline",
              lastSeen: new Date(),
            });

            // Broadcast offline status
            socket.broadcast.emit("user:offline", {
              userId,
              status: "offline",
              lastSeen: new Date(),
            });
          }
        }
      } catch (err) {
        console.error(`[Socket] disconnect error for user ${userId}:`, err);
      }
    });
  });

  // Attach io to server for access in controllers
  return io;
};

export { initializeSocket, emitToUser, emitToChat, getUserSocketIds };

import Chat from "../models/Chats.js";
import Message from "../models/Messages.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Types } from "mongoose";
import { redisClient } from "../redis/redisClient.js";
import aiQueue from "../queues/ai.queue.js";
import { checkAiRateLimit } from "../utils/ai-rate-limiter.js";

// Check if user is participant of chat
const ensureChatParticipant = async (chatId, userId) => {
  const chat = await Chat.findById(chatId).lean();
  if (!chat) throw new ApiError(404, "Chat not found");
  const isParticipant = chat.participants.some(
    (p) => p.toString() === userId.toString(),
  );
  if (!isParticipant)
    throw new ApiError(403, "You are not a participant of this chat");
  return chat;
};

/**
 * POST /api/ai/summary
 * Request a catch-up summary of unread messages in a chat.
 */
const requestCatchUpSummary = asyncHandler(async (req, res) => {
  const { chatId } = req.body;
  const userId = req.user._id;

  if (!Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Invalid chatId format");
  }

  await ensureChatParticipant(chatId, userId);

  // Check per-user rate limit
  const { remaining } = await checkAiRateLimit(userId);

  // Find unread messages (not in user's readBy, not deleted, has content)
  const unreadMessages = await Message.find({
    chat: chatId,
    readBy: { $ne: userId },
    isDeleted: { $ne: true },
    content: { $exists: true, $ne: "" },
  })
    .sort({ createdAt: 1 })
    .select("_id")
    .lean();

  if (unreadMessages.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { summary: "You're all caught up! No unread messages." },
          "No unread messages",
        ),
      );
  }

  // Check Redis cache
  const cacheKey = `ai:summary:${chatId}:${userId}:${unreadMessages.length}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { summary: cached, cached: true },
          "Summary retrieved from cache",
        ),
      );
  }

  // Enqueue AI job
  const messageIds = unreadMessages.map((m) => m._id);
  await aiQueue.add("summary", {
    chatId,
    userId: userId.toString(),
    messageIds,
    cacheKey,
  });

  // Respond immediately — summary will stream via Socket.IO
  return res.status(202).json(
    new ApiResponse(
      202,
      {
        status: "processing",
        messageCount: unreadMessages.length,
        rateLimitRemaining: remaining,
      },
      "Summary generation started. Listen for socket events.",
    ),
  );
});

export { requestCatchUpSummary };

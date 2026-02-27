import Chat from "../models/Chats.js";
import Message from "../models/Messages.js";
import BlockedUser from "../models/BlockedUser.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Types } from "mongoose";
import { MESSAGE_PARTICIPANT_PROJECTION } from "../constants/projections.js";
import { sanitize } from "../utils/sanitize.js";
import aiQueue from "../queues/ai.queue.js";
import { checkAiRateLimit } from "../utils/ai-rate-limiter.js";

// Helper to emit socket events to a room
const emitSocketEvent = (req, room, event, data) => {
  const io = req.app.get("io");
  if (io) {
    io.to(room).emit(event, data);
  }
};

// Check if user is participant of chat
const ensureChatParticipant = async (chatId, userId) => {
  const chat = await Chat.findById(chatId).lean();
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }
  const userIdStr = userId.toString();
  const isParticipant = chat.participants.some(
    (participantId) => participantId.toString() === userIdStr,
  );
  if (!isParticipant) {
    throw new ApiError(403, "You are not a participant of this chat");
  }
  return chat;
};

// Check if message contains @ai mention and trigger AI response (fire-and-forget)
const checkAndTriggerAiResponse = async (chatId, userId, content) => {
  if (!content || !content.toLowerCase().includes("@ai")) return;

  try {
    await checkAiRateLimit(userId);

    // Fetch last 20 messages for context
    const contextMessages = await Message.find({
      chat: chatId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("sender", "username")
      .lean();

    const contextForAI = contextMessages.reverse().map((m) => ({
      senderName: m.sender?.username || "Unknown",
      content: m.content || "[attachment]",
    }));

    // Extract the question (text after @ai)
    const aiMentionIndex = content.toLowerCase().indexOf("@ai");
    const userMessage = content.substring(aiMentionIndex + 3).trim() || content;

    const aiUserId = process.env.AI_SYSTEM_USER_ID;
    if (!aiUserId) {
      console.warn("[AI] AI_SYSTEM_USER_ID not configured");
      return;
    }

    await aiQueue.add("aiChat", {
      chatId,
      userId: userId.toString(),
      userMessage,
      contextMessages: contextForAI,
      aiUserId,
    });
  } catch (err) {
    // Rate limited or error — log but don't block the original message
    console.warn("[AI] Failed to trigger AI response:", err.message);
  }
};

//------------------------------------------------------------------------
//--------------------------- Send Message ------------------------------
//------------------------------------------------------------------------
const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, content } = req.body;
  let { attachments } = req.body;
  const userId = req.user._id;

  // Build attachments from uploaded files (multer/cloudinary)
  if (req.files && req.files.length > 0) {
    attachments = req.files.map((file) => ({
      url: file.path, // Cloudinary URL
      type: file.mimetype.startsWith("image/") ? "image" : "file",
      size: file.size,
      fileName: file.originalname,
    }));
  }

  // Validate at least content OR attachments exists
  if (!content?.trim() && (!attachments || attachments.length === 0)) {
    throw new ApiError(400, "Message must have either content or attachments");
  }

  // Validate chatId and ensure user is participant
  if (!Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Invalid chatId format");
  }

  const chat = await ensureChatParticipant(chatId, userId);

  // In direct chats, check if either user has blocked the other
  if (chat.type === "direct") {
    const otherParticipant = chat.participants.find(
      (p) => p.toString() !== userId.toString()
    );
    if (otherParticipant) {
      const isBlocked = await BlockedUser.findOne({
        $or: [
          { blocker: userId, blocked: otherParticipant },
          { blocker: otherParticipant, blocked: userId },
        ],
      }).lean();
      if (isBlocked) {
        throw new ApiError(403, "Cannot send message — user is blocked");
      }
    }
  }

  // Determine message type based on attachments
  let messageType = "text";
  if (attachments && attachments.length > 0) {
    const hasFiles = attachments.some((att) => att.type === "file");
    messageType = hasFiles ? "file" : "image";
  }

  // Validate replyTo if provided
  const { replyTo } = req.body;
  if (replyTo) {
    if (!Types.ObjectId.isValid(replyTo)) {
      throw new ApiError(400, "Invalid replyTo format");
    }
    const replyMessage = await Message.findById(replyTo).lean();
    if (!replyMessage || replyMessage.chat.toString() !== chatId) {
      throw new ApiError(404, "Reply target message not found in this chat");
    }
  }

  // Create message
  const message = await Message.create({
    chat: chatId,
    sender: userId,
    content: content ? sanitize(content.trim()) : null,
    type: messageType,
    attachments: attachments || [],
    replyTo: replyTo || null,
  });

  // Update chat's lastMessage and lastMessageAt in one operation
  await Chat.findByIdAndUpdate(chatId, {
    $set: {
      lastMessage: message._id,
      lastMessageAt: message.createdAt,
    },
  });

  // Populate sender and replyTo info for response
  const populatedMessage = await Message.findById(message._id)
    .populate("sender", `${MESSAGE_PARTICIPANT_PROJECTION}`)
    .populate({
      path: "replyTo",
      select: "content sender type isDeleted",
      populate: { path: "sender", select: "username avatar" },
    })
    .lean();

  // Emit socket event for real-time message delivery
  emitSocketEvent(req, `chat:${chatId}`, "message:new", {
    chatId,
    message: populatedMessage,
  });

  // Emit chat update event for sidebar
  emitSocketEvent(req, `chat:${chatId}`, "chat:update", {
    chatId,
    lastMessage: populatedMessage,
  });

  // Check for @ai mention and trigger AI response (fire-and-forget)
  checkAndTriggerAiResponse(chatId, userId.toString(), content);

  return res
    .status(201)
    .json(new ApiResponse(201, { message: populatedMessage }, "Message sent successfully"));
});

//------------------------------------------------------------------------
//---------------------- Get Messages by ChatId -------------------------
//------------------------------------------------------------------------
const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;
  let { cursor = null, limit = 20 } = req.query;

  // Validate chatId
  if (!Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Invalid chatId format");
  }

  // Ensure user is participant
  await ensureChatParticipant(chatId, userId);

  // Normalize limit
  let parsedLimit = Number(limit);
  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) parsedLimit = 20;
  parsedLimit = Math.min(parsedLimit, 50); // Max 50 messages per request

  // Build filter for cursor-based pagination
  const filter = { chat: chatId };
  if (cursor) {
    // Cursor can be either ObjectId or ISO date string
    if (Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    } else {
      const cursorDate = new Date(cursor);
      if (isNaN(cursorDate.getTime())) {
        throw new ApiError(400, "Invalid cursor format");
      }
      filter.createdAt = { $lt: cursorDate };
    }
  }

  // Fetch messages (sorted by newest first, then reverse for display)
  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(parsedLimit)
    .populate("sender", "_id username avatar status")
    .populate({
      path: "replyTo",
      select: "content sender type isDeleted",
      populate: { path: "sender", select: "username avatar" },
    })
    .lean();

  // Reverse to show oldest first (natural chat order)
  const orderedMessages = messages.reverse();

  const hasMore = messages.length === parsedLimit;
  const lastMessage = messages[messages.length - 1];
  const nextCursor =
    hasMore && lastMessage ? lastMessage.createdAt.toISOString() : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        messages: orderedMessages,
        nextCursor,
        hasMore,
      },
      "Messages fetched successfully",
    ),
  );
});

//------------------------------------------------------------------------
//--------------------- Mark Messages as Read ---------------------------
//------------------------------------------------------------------------
const markMessagesRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;
  const { messageId } = req.body; 
// Optional: mark specific message or all

  // Validate chatId
  if (!Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Invalid chatId format");
  }

  // Ensure user is participant
  await ensureChatParticipant(chatId, userId);

  // Build filter: messages in this chat not yet read by user
  const filter = {
    chat: chatId,
    readBy: { $ne: userId },
  };

  // If messageId provided, mark up to that message only
  if (messageId) {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new ApiError(400, "Invalid messageId format");
    }
    const targetMessage = await Message.findById(messageId).lean();
    if (!targetMessage || targetMessage.chat.toString() !== chatId) {
      throw new ApiError(404, "Message not found in this chat");
    }
    // Mark all messages up to and including this message
    filter.createdAt = { $lte: targetMessage.createdAt };
  }

  // Update all matching messages: add userId to readBy array
  const result = await Message.updateMany(filter, {
    $addToSet: { readBy: userId },
  });

  // Emit socket event for read receipts
  if (result.modifiedCount > 0) {
    emitSocketEvent(req, `chat:${chatId}`, "messages:read", {
      chatId,
      readBy: userId,
      count: result.modifiedCount,
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        markedCount: result.modifiedCount,
      },
      "Messages marked as read successfully",
    ),
  );
});

//------------------------------------------------------------------------
//--------------------------- Edit Message --------------------------------
//------------------------------------------------------------------------
const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!Types.ObjectId.isValid(messageId)) {
    throw new ApiError(400, "Invalid messageId format");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Content is required for editing");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only edit your own messages");
  }

  if (message.isDeleted) {
    throw new ApiError(400, "Cannot edit a deleted message");
  }

  // Check 15-minute edit window
  const timeSinceSent = Date.now() - new Date(message.createdAt).getTime();
  if (timeSinceSent > EDIT_WINDOW_MS) {
    throw new ApiError(400, "Edit window has expired (15 minutes)");
  }

  // Store original content on first edit
  if (!message.isEdited) {
    message.originalContent = message.content;
  }

  message.content = sanitize(content.trim());
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  const chatId = message.chat.toString();

  // Emit real-time update
  emitSocketEvent(req, `chat:${chatId}`, "message:edited", {
    chatId,
    messageId,
    content: message.content,
    isEdited: true,
    editedAt: message.editedAt,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { message }, "Message edited successfully"));
});

//------------------------------------------------------------------------
//-------------------------- Delete Message --------------------------------
//------------------------------------------------------------------------
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  if (!Types.ObjectId.isValid(messageId)) {
    throw new ApiError(400, "Invalid messageId format");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Allow sender or group admin to delete
  const chat = await Chat.findById(message.chat).lean();
  const isSender = message.sender.toString() === userId.toString();
  const isAdmin = chat?.admins?.some((a) => a.toString() === userId.toString());

  if (!isSender && !isAdmin) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  if (message.isDeleted) {
    throw new ApiError(400, "Message is already deleted");
  }

  // Soft delete
  message.isDeleted = true;
  message.content = "This message was deleted";
  message.attachments = [];
  await message.save();

  const chatId = message.chat.toString();

  // Emit real-time update
  emitSocketEvent(req, `chat:${chatId}`, "message:deleted", {
    chatId,
    messageId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Message deleted successfully"));
});

//------------------------------------------------------------------------
//------------------------- Toggle Reaction --------------------------------
//------------------------------------------------------------------------
const toggleReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  if (!Types.ObjectId.isValid(messageId)) {
    throw new ApiError(400, "Invalid messageId format");
  }

  if (!emoji || typeof emoji !== "string") {
    throw new ApiError(400, "Emoji is required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Ensure user is a participant of the chat
  await ensureChatParticipant(message.chat.toString(), userId);

  // Find existing reaction group for this emoji
  const reactionIndex = message.reactions.findIndex((r) => r.emoji === emoji);

  if (reactionIndex !== -1) {
    const reaction = message.reactions[reactionIndex];
    const userIndex = reaction.users.findIndex(
      (u) => u.toString() === userId.toString()
    );

    if (userIndex !== -1) {
      // User already reacted — remove their reaction
      reaction.users.splice(userIndex, 1);
      // If no users left, remove the entire reaction group
      if (reaction.users.length === 0) {
        message.reactions.splice(reactionIndex, 1);
      }
    } else {
      // Add user to this reaction
      reaction.users.push(userId);
    }
  } else {
    // New emoji reaction group
    message.reactions.push({ emoji, users: [userId] });
  }

  await message.save();

  const chatId = message.chat.toString();

  // Emit real-time update
  emitSocketEvent(req, `chat:${chatId}`, "message:reacted", {
    chatId,
    messageId,
    reactions: message.reactions,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { reactions: message.reactions }, "Reaction toggled")
    );
});

//------------------------------------------------------------------------
//------------------------- Search Messages --------------------------------
//------------------------------------------------------------------------
const searchMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;
  let { q, cursor, limit = 20 } = req.query;

  if (!q || !q.trim()) {
    throw new ApiError(400, "Search query is required");
  }

  limit = Math.min(parseInt(limit, 10) || 20, 50);

  // If chatId provided, search within that chat
  if (chatId) {
    if (!Types.ObjectId.isValid(chatId)) {
      throw new ApiError(400, "Invalid chatId format");
    }
    await ensureChatParticipant(chatId, userId);
  }

  // Build filter
  const filter = {
    content: { $regex: q.trim(), $options: "i" },
    isDeleted: { $ne: true },
  };

  if (chatId) {
    filter.chat = chatId;
  } else {
    // Global search: only in user's chats
    const userChats = await Chat.find({ participants: userId })
      .select("_id")
      .lean();
    filter.chat = { $in: userChats.map((c) => c._id) };
  }

  if (cursor && Types.ObjectId.isValid(cursor)) {
    filter._id = { $lt: new Types.ObjectId(cursor) };
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "_id username avatar")
    .populate("chat", "name type participants")
    .lean();

  const hasMore = messages.length === limit;
  const nextCursor = hasMore ? messages[messages.length - 1]._id : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      { messages, nextCursor, hasMore },
      "Search results fetched"
    )
  );
});

export {
  sendMessage,
  getMessages,
  markMessagesRead,
  editMessage,
  deleteMessage,
  toggleReaction,
  searchMessages,
};

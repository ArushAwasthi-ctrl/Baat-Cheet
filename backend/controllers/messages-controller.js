import Chat from "../models/Chats.js";
import Message from "../models/Messages.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Types } from "mongoose";
import { MESSAGE_PARTICIPANT_PROJECTION } from "../constants/projections.js";

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

//------------------------------------------------------------------------
//--------------------------- Send Message ------------------------------
//------------------------------------------------------------------------
const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, content, attachments } = req.body;
  const userId = req.user._id;

  // Validate at least content OR attachments exists
  if (!content?.trim() && (!attachments || attachments.length === 0)) {
    throw new ApiError(400, "Message must have either content or attachments");
  }

  // Validate chatId and ensure user is participant
  if (!Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Invalid chatId format");
  }

  await ensureChatParticipant(chatId, userId);

  // Determine message type based on attachments
  let messageType = "text";
  if (attachments && attachments.length > 0) {
    // If attachments exist, check if all are images or mixed
    const hasImages = attachments.some((att) => att.type === "image");
    const hasFiles = attachments.some((att) => att.type === "file");
    messageType = hasFiles ? "file" : "image";
  }

  // Create message
  const message = await Message.create({
    chat: chatId,
    sender: userId,
    content: content?.trim() || null,
    type: messageType,
    attachments: attachments || [],
  });

  // Update chat's lastMessage and lastMessageAt in one operation
  await Chat.findByIdAndUpdate(chatId, {
    $set: {
      lastMessage: message._id,
      lastMessageAt: message.createdAt,
    },
  });

  // Populate sender info for response
  const populatedMessage = await Message.findById(message._id)
    .populate("sender", `${MESSAGE_PARTICIPANT_PROJECTION}`)
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

export { sendMessage, getMessages, markMessagesRead };

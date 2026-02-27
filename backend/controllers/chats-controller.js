import User from "../models/Users.js";
import Chat from "../models/Chats.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Types } from "mongoose";
import { CHAT_PARTICIPANT_PROJECTION } from "../constants/projections.js";
import { sanitize } from "../utils/sanitize.js";

const MAX_CHAT_LIMIT = 50;

// Helper to emit socket events
const emitSocketEvent = (req, room, event, data) => {
  const io = req.app.get("io");
  if (io) {
    io.to(room).emit(event, data);
  }
};

// Helper to emit to specific user
const emitToUser = (req, userId, event, data) => {
  const io = req.app.get("io");
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

//------------------------------------------------------------------------
//------------------------ Create or Get Direct Chat ----------------------
//------------------------------------------------------------------------
const createOrGetDirectChat = asyncHandler(async (req, res) => {
  const currentId = req.user._id;
  const { userId } = req.body;

  if (!userId) throw new ApiError(400, "userId is required");

  if (!Types.ObjectId.isValid(userId))
    throw new ApiError(400, "Invalid userId format");

  if (String(currentId) === String(userId))
    throw new ApiError(400, "You cannot create chat with yourself");

  const userExists = await User.exists({ _id: userId });
  if (!userExists) throw new ApiError(404, "User not found");

  // Atomically find or create direct chat to prevent race conditions.
  // Without upsert, two concurrent requests could both pass findOne (both get null)
  // and both call create, resulting in duplicate direct chats.
  const sortedParticipants = [currentId, userId].sort((a, b) =>
    a.toString().localeCompare(b.toString()),
  );

  const existing = await Chat.findOne({
    type: "direct",
    participants: { $all: sortedParticipants, $size: 2 },
  });

  if (existing) {
    const populatedChat = await Chat.findById(existing._id)
      .populate("participants", CHAT_PARTICIPANT_PROJECTION)
      .lean({ virtuals: true });
    return res
      .status(200)
      .json(new ApiResponse(200, { chat: populatedChat }, "Direct chat found successfully"));
  }

  const newChat = await Chat.create({
    type: "direct",
    participants: sortedParticipants,
  });

  const populatedChat = await Chat.findById(newChat._id)
    .populate("participants", CHAT_PARTICIPANT_PROJECTION)
    .lean({ virtuals: true });

  // Emit socket event to the other user about new chat
  emitToUser(req, userId, "chat:new", { chat: populatedChat });

  return res
    .status(201)
    .json(
      new ApiResponse(201, { chat: populatedChat }, "Direct chat created successfully"),
    );
});

//-------------------------------------------------------------------------
//-------------------------- Create Group Chat ----------------------------
//-------------------------------------------------------------------------
const createorGetGroupChat = asyncHandler(async (req, res) => {
  const currentId = req.user._id;
  const currentIdStr = currentId.toString();
  const { name, description, participants } = req.body;
  const trimmedName = sanitize(name.trim());

  // Remove duplicates + include current user
  const normalizedParticipants = participants
    .map((participantId) => participantId?.toString().trim())
    .filter(
      (participantId) =>
        participantId &&
        Types.ObjectId.isValid(participantId) &&
        participantId !== currentIdStr,
    );
  const uniqueParticipantIds = [...new Set(normalizedParticipants)];

  if (uniqueParticipantIds.length < 2) {
    throw new ApiError(
      400,
      "Group must include at least two other participants besides you",
    );
  }

  // Verify all participants exist in the database
  const existingUsers = await User.find({ _id: { $in: uniqueParticipantIds } }).select("_id").lean({ virtuals: true });
  const existingUserIds = existingUsers.map((u) => u._id.toString());
  const nonExistentIds = uniqueParticipantIds.filter((id) => !existingUserIds.includes(id));
  if (nonExistentIds.length > 0) {
    throw new ApiError(404, "Some participants do not exist", false, { nonExistentIds });
  }

  const finalParticipants = [
    currentId,
    ...uniqueParticipantIds.map((id) => new Types.ObjectId(id)),
  ];

  // Optional: prevent duplicate group names for same admin
  const existing = await Chat.findOne({
    type: "group",
    name: trimmedName,
    admins: currentId,
  }).lean({ virtuals: true });

  if (existing) {
    const populatedExisting = await Chat.findById(existing._id)
      .populate("participants", CHAT_PARTICIPANT_PROJECTION)
      .lean({ virtuals: true });
    return res
      .status(200)
      .json(
        new ApiResponse(200, populatedExisting, "Group chat already exists"),
      );
  }

  const newGroup = await Chat.create({
    type: "group",
    name: trimmedName,
    ...(description && { description: sanitize(description.trim()) }),
    participants: finalParticipants,
    admins: [currentId],
  });

  const populatedGroup = await Chat.findById(newGroup._id)
    .populate("participants", CHAT_PARTICIPANT_PROJECTION)
    .populate("admins", "_id username avatar")
    .lean({ virtuals: true });

  // Emit socket event to all participants about new group
  uniqueParticipantIds.forEach((participantId) => {
    emitToUser(req, participantId, "chat:new", { chat: populatedGroup });
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, { chat: populatedGroup }, "Group chat created successfully"),
    );
});

// ------------------------------------------------------------------------
// --------------------------- Get Chat By ID -----------------------------
// ------------------------------------------------------------------------
const getChatById = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id.toString();
  const { chatId } = req.params;

  if (!Types.ObjectId.isValid(chatId))
    throw new ApiError(400, "Invalid chatId");

  const chat = await Chat.findById(chatId)
    .populate("participants", CHAT_PARTICIPANT_PROJECTION)
    .populate("admins", "_id username avatar")
    .populate("lastMessage")
    .lean({ virtuals: true });

  if (!chat) throw new ApiError(404, "Chat does not exist");
  const isParticipant = chat.participants.some(
    (participant) => participant._id.toString() === currentUserId,
  );
  if (!isParticipant)
    throw new ApiError(403, "You are not a participant of this chat");

  return res
    .status(200)
    .json(new ApiResponse(200, { chat }, "Chat found successfully"));
});

// ------------------------------------------------------------------------
// ------------------------ Get All User Chats ----------------------------
// ------------------------------------------------------------------------
const getUserChats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let { cursor = null, limit = 10 } = req.query;

  let parsedLimit = Number(limit);
  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) parsedLimit = 10;
  parsedLimit = Math.min(parsedLimit, MAX_CHAT_LIMIT);

  const filter = { participants: userId };

  // cursor pagination on lastMessageAt
  if (cursor) {
    const cursorDate = new Date(cursor);
    filter.lastMessageAt = { $lt: cursorDate };
  }

  const chats = await Chat.find(filter)
    .sort({ lastMessageAt: -1 })
    .limit(parsedLimit)
    .populate("participants", CHAT_PARTICIPANT_PROJECTION)
    .lean({ virtuals: true });

  const hasMore = chats.length === parsedLimit;
  const lastChat = chats[chats.length - 1];
  const nextCursor =
    hasMore && lastChat?.lastMessageAt
      ? lastChat.lastMessageAt.toISOString()
      : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        chats,
        nextCursor,
        hasMore,
      },
      "Chats fetched successfully",
    ),
  );
});

// ------------------------------------------------------------------------
// ------------------------ Update the Group  ----------------------------
// ------------------------------------------------------------------------
const updateGroupInfo = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { name, avatar } = req.body;
  const currentUserId = req.user._id;

  if (!Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Invalid chatId format");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");
  if (chat.type !== "group") throw new ApiError(400, "Not a group chat");

  const isAdmin = chat.admins.some(
    (id) => id.toString() === currentUserId.toString(),
  );
  if (!isAdmin) throw new ApiError(403, "Only admins can update group");

  const update = {};
  if (typeof name === "string" && name.trim()) update.name = sanitize(name.trim());
  if (typeof avatar === "string" && avatar.trim())
    update.avatar = avatar.trim();

  if (Object.keys(update).length === 0) {
    throw new ApiError(400, "No valid fields to update");
  }

  const updated = await Chat.findByIdAndUpdate(
    chatId,
    { $set: update },
    { new: true },
  )
    .populate("participants", "_id username avatar status lastSeen")
    .populate("admins", "_id username avatar")
    .lean({ virtuals: true });

  // Emit socket event to all participants about group update
  emitSocketEvent(req, `chat:${chatId}`, "group:updated", {
    chatId,
    chat: updated,
    action: "infoUpdated",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { chat: updated }, "Group updated successfully"));
});

// ------------------------------------------------------------------------
// ------------------------ Add members in the group  -------------------
//------------------------------------------------------------------------

const addMembers = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { memberIds } = req.body; // array
  const currentUserId = req.user._id;

  if (!Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Chat Id is invalid");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");
  if (chat.type !== "group") throw new ApiError(400, "Not a group chat");

  const isAdmin = chat.admins.some(
    (id) => id.toString() === currentUserId.toString(),
  );
  if (!isAdmin) throw new ApiError(403, "Only admins can update group");

  // normalize + dedupe
  const uniqueIds = [...new Set(memberIds.map(String))];

  // Validate that all member IDs are valid ObjectIds
  const invalidIds = uniqueIds.filter((id) => !Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    throw new ApiError(400, "Some member IDs are invalid", false, { invalidIds });
  }

  // Verify all users exist in the database
  const existingUsers = await User.find({ _id: { $in: uniqueIds } }).select("_id").lean({ virtuals: true });
  const existingUserIds = existingUsers.map((u) => u._id.toString());
  const nonExistentIds = uniqueIds.filter((id) => !existingUserIds.includes(id));
  if (nonExistentIds.length > 0) {
    throw new ApiError(404, "Some users do not exist", false, { nonExistentIds });
  }

  // filter out already-participants
  const existing = chat.participants.map((id) => id.toString());
  const newIds = uniqueIds.filter((id) => !existing.includes(id));

  if (newIds.length === 0) {
    const populated = await Chat.findById(chatId)
      .populate("participants", CHAT_PARTICIPANT_PROJECTION)
      .populate("admins", "_id username avatar")
      .lean({ virtuals: true });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { chat: populated },
          "No new members to add (already in group)",
        ),
      );
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $addToSet: { participants: { $each: newIds } },
    },
    { new: true },
  )
    .populate("participants", CHAT_PARTICIPANT_PROJECTION)
    .populate("admins", "_id username avatar")
    .lean({ virtuals: true });

  // Emit socket event to existing participants
  emitSocketEvent(req, `chat:${chatId}`, "group:updated", {
    chatId,
    chat: updatedChat,
    action: "membersAdded",
    newMembers: newIds,
  });

  // Emit socket event to new members about being added to group
  newIds.forEach((memberId) => {
    emitToUser(req, memberId, "chat:new", { chat: updatedChat });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { chat: updatedChat }, "Members added successfully"));
});

// ------------------------------------------------------------------------
// ------------------------ Remove members in the group  ----------------
//------------------------------------------------------------------------

const removeMembers = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { chatId } = req.params;
  const { memberIds } = req.body;

  if (!Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Chat Id is invalid");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");
  if (chat.type !== "group") throw new ApiError(400, "Not a group chat");

  const isAdmin = chat.admins.some(
    (id) => id.toString() === currentUserId.toString(),
  );
  if (!isAdmin) throw new ApiError(403, "Only admins can update group");

  // normalize + dedupe requested ids
  const uniqueIds = [...new Set(memberIds.map(String))];

  // Prevent admin from removing themselves (should use leaveGroup instead)
  const currentUserIdStr = currentUserId.toString();
  if (uniqueIds.includes(currentUserIdStr)) {
    throw new ApiError(400, "You cannot remove yourself. Use 'Leave Group' instead.");
  }

  // ensure all requested ids are actually participants
  const participantIds = chat.participants.map((id) => id.toString());
  const notInParticipants = uniqueIds.filter(
    (id) => !participantIds.includes(id),
  );

  if (notInParticipants.length > 0) {
    throw new ApiError(400, "Some members are not part of the group", false, {
      notInParticipants,
    });
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: {
        participants: { $in: uniqueIds },
        admins: { $in: uniqueIds },
      },
    },
    { new: true },
  )
    .populate("participants", CHAT_PARTICIPANT_PROJECTION)
    .populate("admins", "_id username avatar")
    .lean({ virtuals: true });

  // Emit socket event to remaining participants
  emitSocketEvent(req, `chat:${chatId}`, "group:updated", {
    chatId,
    chat: updatedChat,
    action: "membersRemoved",
    removedMembers: uniqueIds,
  });

  // Emit socket event to removed members
  uniqueIds.forEach((memberId) => {
    emitToUser(req, memberId, "chat:removed", { chatId });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { chat: updatedChat }, "Members removed successfully"));
});

const promoteToAdmin = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { chatId } = req.params;
  const { memberId } = req.body;

  if (!Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Chat Id is invalid");
  }
  if (!Types.ObjectId.isValid(memberId)) {
    throw new ApiError(400, "Member Id is invalid");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");
  if (chat.type !== "group") throw new ApiError(400, "Not a group chat");

  const isAdmin = chat.admins.some(
    (id) => id.toString() === currentUserId.toString(),
  );
  if (!isAdmin) throw new ApiError(403, "Only admins can promote members");

  // Check if the member is participant or not
  const participantIds = chat.participants.map((id) => id.toString());
  const isParticipant = participantIds.includes(memberId);

  if (!isParticipant) {
    throw new ApiError(400, "User is not a participant of this group");
  }

  // Check if already an admin
  const alreadyAdmin = chat.admins.some((id) => id.toString() === memberId);
  if (alreadyAdmin) {
    throw new ApiError(400, "User is already an admin");
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $addToSet: {
        admins: memberId,
      },
    },
    { new: true },
  )
    .populate("participants", CHAT_PARTICIPANT_PROJECTION)
    .populate("admins", "_id username avatar")
    .lean({ virtuals: true });

  // Emit socket event to all participants
  emitSocketEvent(req, `chat:${chatId}`, "group:updated", {
    chatId,
    chat: updatedChat,
    action: "adminPromoted",
    promotedMember: memberId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { chat: updatedChat }, "Member promoted to admin successfully"));
});

// ------------------------------------------------------------------------
// ------------------------ Leave Group Chat ------------------------------
// ------------------------------------------------------------------------
const leaveGroup = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { chatId } = req.params;

  if (!Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Chat Id is invalid");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");
  if (chat.type !== "group") throw new ApiError(400, "Not a group chat");

  const currentUserIdStr = currentUserId.toString();
  const isParticipant = chat.participants.some(
    (id) => id.toString() === currentUserIdStr,
  );
  if (!isParticipant) {
    throw new ApiError(400, "You are not a member of this group");
  }

  const isAdmin = chat.admins.some((id) => id.toString() === currentUserIdStr);
  const isOnlyAdmin = isAdmin && chat.admins.length === 1;
  const hasOtherParticipants = chat.participants.length > 1;

  // If user is the only admin and there are other participants,
  // they must promote someone else first
  if (isOnlyAdmin && hasOtherParticipants) {
    throw new ApiError(
      400,
      "You are the only admin. Please promote another member to admin before leaving.",
    );
  }

  // Remove user from participants and admins
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: {
        participants: currentUserId,
        admins: currentUserId,
      },
    },
    { new: true },
  )
    .populate("participants", CHAT_PARTICIPANT_PROJECTION)
    .populate("admins", "_id username avatar")
    .lean({ virtuals: true });

  // If no participants left, delete the chat
  if (updatedChat.participants.length === 0) {
    await Chat.findByIdAndDelete(chatId);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "You left the group and it was deleted"));
  }

  // Emit socket event to remaining participants
  emitSocketEvent(req, `chat:${chatId}`, "group:updated", {
    chatId,
    chat: updatedChat,
    action: "memberLeft",
    leftMember: currentUserIdStr,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { chat: updatedChat }, "You left the group successfully"));
});

// ------------------------------------------------------------------------
// ------------------------ Delete Chat -----------------------------------
// ------------------------------------------------------------------------
const deleteChat = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { chatId } = req.params;

  if (!Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Chat Id is invalid");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");

  // Verify user is a participant
  const currentUserIdStr = currentUserId.toString();
  const isParticipant = chat.participants.some(
    (id) => id.toString() === currentUserIdStr,
  );
  if (!isParticipant) {
    throw new ApiError(403, "You are not a participant of this chat");
  }

  // For group chats, only admins can delete
  if (chat.type === "group") {
    const isAdmin = chat.admins.some(
      (id) => id.toString() === currentUserIdStr,
    );
    if (!isAdmin) {
      throw new ApiError(403, "Only admins can delete a group chat");
    }
  }

  // Delete all messages in this chat
  const Message = (await import("../models/Messages.js")).default;
  await Message.deleteMany({ chat: chatId });

  // Delete the chat
  await Chat.findByIdAndDelete(chatId);

  // Emit socket event to all participants
  chat.participants.forEach((participantId) => {
    emitToUser(req, participantId.toString(), "chat:removed", { chatId });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Chat deleted successfully"));
});

// Export controllers
export {
  createOrGetDirectChat,
  createorGetGroupChat,
  getChatById,
  getUserChats,
  updateGroupInfo,
  addMembers,
  removeMembers,
  promoteToAdmin,
  leaveGroup,
  deleteChat,
};

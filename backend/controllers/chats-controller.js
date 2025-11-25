import User from "../models/Users.js";
import Chat from "../models/Chats.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Types } from "mongoose";
import { CHAT_PARTICIPANT_PROJECTION } from "../constants/projections.js";

const MAX_CHAT_LIMIT = 50;

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

  // Check if chat already exists
  const chatData = await Chat.findOne({
    type: "direct",
    participants: { $all: [currentId, userId], $size: 2 },
  })
    .populate("participants", CHAT_PARTICIPANT_PROJECTION)
    .lean();

  if (chatData) {
    return res
      .status(200)
      .json(new ApiResponse(200, chatData, "Direct chat found successfully"));
  }

  // Create new direct chat
  const newChat = await Chat.create({
    type: "direct",
    participants: [currentId, userId],
  });

  const populatedChat = await Chat.findById(newChat._id)
    .populate("participants", CHAT_PARTICIPANT_PROJECTION)
    .lean();

  return res
    .status(201)
    .json(
      new ApiResponse(201, populatedChat, "Direct chat created successfully"),
    );
});

//-------------------------------------------------------------------------
//-------------------------- Create Group Chat ----------------------------
//-------------------------------------------------------------------------
const createorGetGroupChat = asyncHandler(async (req, res) => {
  const currentId = req.user._id;
  const currentIdStr = currentId.toString();
  const { name, participants } = req.body;
  const trimmedName = name.trim();

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

  const finalParticipants = [
    currentId,
    ...uniqueParticipantIds.map((id) => new Types.ObjectId(id)),
  ];

  // Optional: prevent duplicate group names for same admin
  const existing = await Chat.findOne({
    type: "group",
    name: trimmedName,
    admins: currentId,
  }).lean();

  if (existing) {
    const populatedExisting = await Chat.findById(existing._id)
      .populate("participants", CHAT_PARTICIPANT_PROJECTION)
      .lean();
    return res
      .status(200)
      .json(
        new ApiResponse(200, populatedExisting, "Group chat already exists"),
      );
  }

  const newGroup = await Chat.create({
    type: "group",
    name: trimmedName,
    participants: finalParticipants,
    admins: [currentId],
  });

  const populatedGroup = await Chat.findById(newGroup._id)
    .populate("participants", CHAT_PARTICIPANT_PROJECTION)
    .lean();

  return res
    .status(201)
    .json(
      new ApiResponse(201, populatedGroup, "Group chat created successfully"),
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
    .lean();

  if (!chat) throw new ApiError(404, "Chat does not exist");
  const isParticipant = chat.participants.some(
    (participant) => participant._id.toString() === currentUserId,
  );
  if (!isParticipant)
    throw new ApiError(403, "You are not a participant of this chat");

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Chat found successfully"));
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
    .lean();

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
  if (typeof name === "string" && name.trim()) update.name = name.trim();
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
    .populate("admins", "_id username avatar");

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Group updated successfully"));
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

  // filter out already-participants
  const existing = chat.participants.map((id) => id.toString());
  const newIds = uniqueIds.filter((id) => !existing.includes(id));

  if (newIds.length === 0) {
    const populated = await Chat.findById(chatId)
      .populate("participants", CHAT_PARTICIPANT_PROJECTION)
      .populate("admins", "_id username avatar")
      .lean();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          populated,
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
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedChat, "Members added successfully"));
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
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedChat, "Members removed successfully"));
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
  if (!isAdmin) throw new ApiError(403, "Only admins can update group");

  // Check if the member is participant or not

  const participantId = chat.participants.map((id) => id.toString());
  const isParticipant = participantId.includes(memberId);

  if (!isParticipant) {
    return new ApiError(
      400,
      "User is not a participant that is to be promoted",
    );
  }
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $addToSet: {
        admins: [memberId],
      },
    },
    { new: true },
  );
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
};

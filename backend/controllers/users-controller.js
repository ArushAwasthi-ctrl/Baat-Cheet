import mongoose, { Types } from "mongoose";
import User from "../models/Users.js";
import Chat from "../models/Chats.js";
import Message from "../models/Messages.js";
import BlockedUser from "../models/BlockedUser.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import {
  PUBLIC_USER_PROJECTION,
  LIST_USER_PROJECTION,
} from "../constants/projections.js";
import { redisClient } from "../redis/redisClient.js";
import { sanitize } from "../utils/sanitize.js";

// Cookie options for clearing (must match auth-controller settings)
const isProd = process.env.NODE_ENV === "production";
const clearCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
};

//---------------------------------------------------------
// GET CURRENT USER
//---------------------------------------------------------
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Unauthorized: No logged-in user found");
  }

  const userData = await User.findById(user._id)
    .select(PUBLIC_USER_PROJECTION)
    .lean();

  if (!userData) {
    throw new ApiError(404, "User not found in database");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userData, "User data fetched successfully"));
});

//---------------------------------------------------------
// GET ALL USERS (SEARCH + CURSOR PAGINATION + OPTIMIZED)
//---------------------------------------------------------
const getAllUsers = asyncHandler(async (req, res) => {
  const currentUser = req.user;

  let { search = "", cursor = null, limit = 20 } = req.query;
  limit = Math.min(parseInt(limit, 10) || 20, 50);

  
// SANITIZE SEARCH (prevent regex injection)
  
  search = escapeRegex(search.trim());

// Build Filter Object (cleaner + faster)
  
  // Get users blocked by current user to exclude from search
  const blockedByMe = await BlockedUser.find({ blocker: currentUser._id })
    .select("blocked")
    .lean();
  const blockedIds = blockedByMe.map((b) => b.blocked);

  const idFilter = { $ne: currentUser._id, $nin: blockedIds };
  if (cursor && Types.ObjectId.isValid(cursor)) {
    idFilter.$gt = new Types.ObjectId(cursor);
  }

  const filter = {
    _id: idFilter,
    ...(search
      ? {
          $or: [
            { username: { $regex: `^${search}`, $options: "i" } },
            { email: { $regex: `^${search}`, $options: "i" } },
          ],
        }
      : {}),
  };
  // Fetch Users
  const users = await User.find(filter)
    .sort({ _id: 1 })
    .limit(limit)
    .select(LIST_USER_PROJECTION)
    .lean();

  const hasMore = users.length === limit;
  const nextCursor = hasMore ? users[users.length - 1]._id : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        nextCursor,
        hasMore,
      },
      "Users fetched successfully",
    ),
  );
});

//---------------------------------------------------------
// GET INDIVIDUAL USER BY ID (OPTIMIZED)
//---------------------------------------------------------
const getIndividualUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "User ID is required");
  }

  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid User ID format");
  }

  //-------------------------------------------------------
  // Fetch & sanitize
  //-------------------------------------------------------
  const user = await User.findById(id).select("-password").lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

//---------------------------------------------------------
// UPDATE PROFILE OF CURRENT USER
//---------------------------------------------------------

const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized: No logged-in user found");
  }

  const { username, bio, avatar } = req.body;

  // Build the update object only with provided fields (sanitize text inputs)
  const update = {};
  if (username !== undefined) update.username = sanitize(username);
  if (bio !== undefined) update.bio = sanitize(bio);
  if (avatar !== undefined) update.avatar = avatar;

  if (Object.keys(update).length === 0) {
    throw new ApiError(400, "No profile fields provided to update");
  }

  // Check username uniqueness if username is being updated
  if (username !== undefined) {
    const existingUser = await User.findOne({
      username,
      _id: { $ne: userId },
    }).lean();
    if (existingUser) {
      throw new ApiError(409, "Username is already taken");
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, runValidators: true },
  )
    .select(PUBLIC_USER_PROJECTION)
    .lean();

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});


//------------------------------------------------------------------------
// DELETE PROFILE OF CURRENT USER
// -----------------------------------------------------------------------
const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized: No logged-in user found");
  }

  // 1. Remove user from all chats (participants and admins)
  await Chat.updateMany(
    { participants: userId },
    { $pull: { participants: userId, admins: userId } }
  );

  // 2. Delete chats where user was the only participant (empty chats)
  await Chat.deleteMany({ participants: { $size: 0 } });

  // 3. Delete direct chats that now have only 1 participant (the other person left)
  await Chat.deleteMany({ type: "direct", participants: { $size: 1 } });

  // 4. Anonymize user's messages (keep messages but remove sender reference)
  await Message.updateMany(
    { sender: userId },
    { $set: { sender: null, content: "[Message from deleted account]" } }
  );

  // 5. Remove user from readBy arrays in messages
  await Message.updateMany(
    { readBy: userId },
    { $pull: { readBy: userId } }
  );

  // 6. Clear Redis tokens
  await redisClient.del(`refresh:${userId}`);

  // 7. Delete user from database
  await User.findByIdAndDelete(userId);

  // 8. Clear cookies
  res
    .clearCookie("accessToken", clearCookieOptions)
    .clearCookie("refreshToken", clearCookieOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Account deleted successfully"));
});

//---------------------------------------------------------
// BLOCK A USER
//---------------------------------------------------------
const blockUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { userId: targetId } = req.params;

  if (!Types.ObjectId.isValid(targetId)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  if (userId.toString() === targetId) {
    throw new ApiError(400, "You cannot block yourself");
  }

  const targetUser = await User.findById(targetId).lean();
  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  // Check if already blocked
  const existing = await BlockedUser.findOne({
    blocker: userId,
    blocked: targetId,
  }).lean();

  if (existing) {
    throw new ApiError(409, "User is already blocked");
  }

  await BlockedUser.create({ blocker: userId, blocked: targetId });

  // Also remove from friends if they were friends
  await User.findByIdAndUpdate(userId, { $pull: { friends: targetId } });
  await User.findByIdAndUpdate(targetId, { $pull: { friends: userId } });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User blocked successfully"));
});

//---------------------------------------------------------
// UNBLOCK A USER
//---------------------------------------------------------
const unblockUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { userId: targetId } = req.params;

  if (!Types.ObjectId.isValid(targetId)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  const result = await BlockedUser.findOneAndDelete({
    blocker: userId,
    blocked: targetId,
  });

  if (!result) {
    throw new ApiError(404, "User is not blocked");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User unblocked successfully"));
});

//---------------------------------------------------------
// GET BLOCKED USERS
//---------------------------------------------------------
const getBlockedUsers = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const blockedList = await BlockedUser.find({ blocker: userId })
    .populate("blocked", "_id username avatar")
    .sort({ createdAt: -1 })
    .lean();

  const users = blockedList.map((b) => b.blocked);

  return res
    .status(200)
    .json(new ApiResponse(200, { users }, "Blocked users fetched"));
});

export {
  getCurrentUser,
  getAllUsers,
  getIndividualUser,
  updateProfile,
  deleteAccount,
  blockUser,
  unblockUser,
  getBlockedUsers,
};

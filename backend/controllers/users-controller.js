import mongoose, { Types } from "mongoose";
import User from "../models/Users.js";
import Chat from "../models/Chats.js";
import Message from "../models/Messages.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import {
  PUBLIC_USER_PROJECTION,
  LIST_USER_PROJECTION,
} from "../constants/projections.js";
import { redisClient } from "../redis/redisClient.js";

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
  
  const filter = {
    _id: { $ne: currentUser._id },
    ...(cursor && Types.ObjectId.isValid(cursor)
      ? { _id: { $gt: new Types.ObjectId(cursor) } }
      : {}),
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

  // Build the update object only with provided fields
  const update = {};
  if (username !== undefined) update.username = username;
  if (bio !== undefined) update.bio = bio;
  if (avatar !== undefined) update.avatar = avatar;

  if (Object.keys(update).length === 0) {
    throw new ApiError(400, "No profile fields provided to update");
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

export { getCurrentUser, getAllUsers, getIndividualUser, updateProfile, deleteAccount };

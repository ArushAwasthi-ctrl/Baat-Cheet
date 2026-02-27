import { Types } from "mongoose";
import FriendRequest from "../models/FriendRequest.js";
import User from "../models/Users.js";
import BlockedUser from "../models/BlockedUser.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/asyncHandler.js";
import { LIST_USER_PROJECTION } from "../constants/projections.js";

// Helper to emit socket events to a specific user
const emitToUser = (req, userId, event, data) => {
  const io = req.app.get("io");
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

//------------------------------------------------------------------------
// SEND FRIEND REQUEST
//------------------------------------------------------------------------
const sendFriendRequest = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const senderId = req.user._id;

  if (senderId.toString() === userId) {
    throw new ApiError(400, "You cannot send a friend request to yourself");
  }

  // Check if target user exists
  const targetUser = await User.findById(userId).lean();
  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  // Check if either user has blocked the other
  const isBlocked = await BlockedUser.findOne({
    $or: [
      { blocker: senderId, blocked: userId },
      { blocker: userId, blocked: senderId },
    ],
  }).lean();
  if (isBlocked) {
    throw new ApiError(403, "Cannot send friend request — user is blocked");
  }

  // Check if already friends
  const sender = await User.findById(senderId).lean();
  if (sender.friends.some((f) => f.toString() === userId)) {
    throw new ApiError(400, "You are already friends with this user");
  }

  // Check if a request already exists (in either direction)
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { sender: senderId, receiver: userId, status: "pending" },
      { sender: userId, receiver: senderId, status: "pending" },
    ],
  }).lean();

  if (existingRequest) {
    throw new ApiError(400, "A friend request already exists between you two");
  }

  const friendRequest = await FriendRequest.create({
    sender: senderId,
    receiver: userId,
  });

  const populatedRequest = await FriendRequest.findById(friendRequest._id)
    .populate("sender", LIST_USER_PROJECTION)
    .populate("receiver", LIST_USER_PROJECTION)
    .lean();

  // Notify the receiver in real-time
  emitToUser(req, userId, "friend:request", {
    request: populatedRequest,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, { request: populatedRequest }, "Friend request sent")
    );
});

//------------------------------------------------------------------------
// GET RECEIVED FRIEND REQUESTS
//------------------------------------------------------------------------
const getReceivedRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let { cursor, limit = 20 } = req.query;
  limit = Math.min(parseInt(limit, 10) || 20, 50);

  const filter = { receiver: userId, status: "pending" };
  if (cursor && Types.ObjectId.isValid(cursor)) {
    filter._id = { $lt: new Types.ObjectId(cursor) };
  }

  const requests = await FriendRequest.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", LIST_USER_PROJECTION)
    .lean();

  const hasMore = requests.length === limit;
  const nextCursor = hasMore ? requests[requests.length - 1]._id : null;

  return res.status(200).json(
    new ApiResponse(200, { requests, nextCursor, hasMore }, "Received requests fetched")
  );
});

//------------------------------------------------------------------------
// GET SENT FRIEND REQUESTS
//------------------------------------------------------------------------
const getSentRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let { cursor, limit = 20 } = req.query;
  limit = Math.min(parseInt(limit, 10) || 20, 50);

  const filter = { sender: userId, status: "pending" };
  if (cursor && Types.ObjectId.isValid(cursor)) {
    filter._id = { $lt: new Types.ObjectId(cursor) };
  }

  const requests = await FriendRequest.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("receiver", LIST_USER_PROJECTION)
    .lean();

  const hasMore = requests.length === limit;
  const nextCursor = hasMore ? requests[requests.length - 1]._id : null;

  return res.status(200).json(
    new ApiResponse(200, { requests, nextCursor, hasMore }, "Sent requests fetched")
  );
});

//------------------------------------------------------------------------
// ACCEPT FRIEND REQUEST
//------------------------------------------------------------------------
const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  const friendRequest = await FriendRequest.findById(requestId);
  if (!friendRequest) {
    throw new ApiError(404, "Friend request not found");
  }

  if (friendRequest.receiver.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only accept requests sent to you");
  }

  if (friendRequest.status !== "pending") {
    throw new ApiError(400, `Request already ${friendRequest.status}`);
  }

  // Update request status
  friendRequest.status = "accepted";
  await friendRequest.save();

  // Add each other as friends
  await User.findByIdAndUpdate(userId, {
    $addToSet: { friends: friendRequest.sender },
  });
  await User.findByIdAndUpdate(friendRequest.sender, {
    $addToSet: { friends: userId },
  });

  const populatedRequest = await FriendRequest.findById(requestId)
    .populate("sender", LIST_USER_PROJECTION)
    .populate("receiver", LIST_USER_PROJECTION)
    .lean();

  // Notify the sender that their request was accepted
  emitToUser(req, friendRequest.sender.toString(), "friend:accepted", {
    request: populatedRequest,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { request: populatedRequest }, "Friend request accepted")
    );
});

//------------------------------------------------------------------------
// REJECT FRIEND REQUEST
//------------------------------------------------------------------------
const rejectFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  const friendRequest = await FriendRequest.findById(requestId);
  if (!friendRequest) {
    throw new ApiError(404, "Friend request not found");
  }

  if (friendRequest.receiver.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only reject requests sent to you");
  }

  if (friendRequest.status !== "pending") {
    throw new ApiError(400, `Request already ${friendRequest.status}`);
  }

  friendRequest.status = "rejected";
  await friendRequest.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Friend request rejected"));
});

//------------------------------------------------------------------------
// REMOVE FRIEND
//------------------------------------------------------------------------
const removeFriend = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  if (currentUserId.toString() === userId) {
    throw new ApiError(400, "Invalid operation");
  }

  // Check if they are actually friends
  const currentUser = await User.findById(currentUserId).lean();
  if (!currentUser.friends.some((f) => f.toString() === userId)) {
    throw new ApiError(400, "This user is not in your friends list");
  }

  // Remove from both users' friends lists
  await User.findByIdAndUpdate(currentUserId, {
    $pull: { friends: userId },
  });
  await User.findByIdAndUpdate(userId, {
    $pull: { friends: currentUserId },
  });

  // Clean up the friend request record
  await FriendRequest.deleteMany({
    $or: [
      { sender: currentUserId, receiver: userId },
      { sender: userId, receiver: currentUserId },
    ],
  });

  // Notify the other user
  emitToUser(req, userId, "friend:removed", {
    userId: currentUserId.toString(),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Friend removed successfully"));
});

//------------------------------------------------------------------------
// GET FRIENDS LIST
//------------------------------------------------------------------------
const getFriends = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let { cursor, limit = 20 } = req.query;
  limit = Math.min(parseInt(limit, 10) || 20, 50);

  const user = await User.findById(userId)
    .populate({
      path: "friends",
      select: LIST_USER_PROJECTION,
      options: { sort: { username: 1 } },
    })
    .lean();

  // Simple cursor-based pagination on friends array
  let friends = user.friends || [];
  if (cursor) {
    const cursorIndex = friends.findIndex((f) => f._id.toString() === cursor);
    if (cursorIndex !== -1) {
      friends = friends.slice(cursorIndex + 1);
    }
  }

  const paginatedFriends = friends.slice(0, limit);
  const hasMore = friends.length > limit;
  const nextCursor = hasMore
    ? paginatedFriends[paginatedFriends.length - 1]._id
    : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      { friends: paginatedFriends, nextCursor, hasMore },
      "Friends list fetched"
    )
  );
});

export {
  sendFriendRequest,
  getReceivedRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
};

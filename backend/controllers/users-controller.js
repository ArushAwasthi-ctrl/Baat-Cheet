import mongoose from "mongoose";
import User from "../models/Users.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/asyncHandler.js";

//---------------------------------------------------------
// GET CURRENT USER
//---------------------------------------------------------
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Unauthorized: No logged-in user found");
  }

  const userData = await User.findById(user._id).select(
    "username email avatar bio isVerified lastSeen status createdAt",
  );

  if (!userData) {
    throw new ApiError(404, "User not found in database");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userData, "User data fetched successfully"));
});

//---------------------------------------------------------
// GET ALL USERS (SEARCH + CURSOR PAGINATION)
//---------------------------------------------------------
const getAllUsers = asyncHandler(async (req, res) => {
  const user = req.user;

  // take query params
  let { search = "", cursor = null, limit = 20 } = req.query;

  // enforce limit max 50 for safety
  limit = Math.min(parseInt(limit, 10) || 20, 50);

  // array of all AND conditions
  const andClauses = [
    // exclude current user
    { _id: { $ne: user._id } },
  ];

  // ------------------------------
  // Search Filter
  // ------------------------------
  if (search.trim() !== "") {
    andClauses.push({
      $or: [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    });
  }

  // ------------------------------
  // Cursor Pagination Filter
  // ------------------------------
  if (cursor) {
    try {
      andClauses.push({
        _id: { $gt: new mongoose.Types.ObjectId(cursor) },
      });
    } catch (err) {
      throw new ApiError(400, "Invalid cursor format");
    }
  }

  const filter = { $and: andClauses };

  // ------------------------------
  //  Fetch Users
  // ------------------------------
  const users = await User.find(filter)
    .sort({ _id: 1 }) // cursor pagination requires sorted order
    .select("username avatar bio isVerified lastSeen status createdAt")
    .limit(limit);

  // ------------------------------
  //  Pagination Info
  // ------------------------------

  const hasMore = users.length === limit;
  const nextCursor = hasMore ? users[users.length - 1]._id : null;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { users, nextCursor, hasMore },
        "Users fetched successfully",
      ),
    );
});

export { getCurrentUser, getAllUsers };

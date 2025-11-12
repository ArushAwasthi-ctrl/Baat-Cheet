import jwt from "jsonwebtoken";
import User from "../models/Users.js";
import ApiError from "../utils/api-error.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc Middleware to protect routes — verifies access token from cookies
 * @usage Attach this middleware to any route that requires authentication
 */

const authValidator = asyncHandler(async (req, res, next) => {
  //  Extract token from cookies (set during login/OTP verification)
  const token = req.cookies?.accessToken;

  // If no token found, user is not logged in
  if (!token) {
    throw new ApiError(401, "Unauthorized access — no access token found");
  }

  try {
    //  Verify the access token using the secret key
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //  Fetch the user details from MongoDB excluding password
    const user = await User.findById(decoded?._id).select("-password");

    if (!user) {
      throw new ApiError(401, "Invalid token — user not found");
    }

    //  Attach user to the request for access in route handlers
    req.user = user;

    //  Continue to next middleware/controller
    next();
  } catch (error) {
    // Handle specific token errors for better debugging and frontend logic
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    } else {
      throw new ApiError(401, "Invalid access token");
    }
  }
});

export default authValidator;

import bcrypt from "bcrypt"; // For password hashing
import crypto from "crypto"; // For hashing refresh tokens
import jwt from "jsonwebtoken";
import User from "../models/Users.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/asyncHandler.js";
import { redisClient } from "../redis/redisClient.js";
import { sendEmail, OTPVerificationMailGenContent } from "../utils/mailgen.js";
import emailQueue from "../queues/email.queue.js";

// ===================== GLOBAL CONFIG =====================
const isProd = process.env.NODE_ENV === "production";

// Access Token cookie (short-lived)
const accessCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict",
  maxAge: 15 * 60 * 1000, // 15 minutes
};

// Refresh Token cookie (long-lived)
const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ===================== HELPER FUNCTIONS =====================

// Generate a 6-digit numeric OTP (cryptographically strong)
const generateOTP = () => crypto.randomInt(100000, 1000000).toString();

// Hash refresh token (to store securely in Redis)
const hashRefreshToken = (refreshToken) =>
  crypto.createHash("sha256").update(refreshToken).digest("hex");

// ===================== REGISTER USER =====================
const registerUser = asyncHandler(async (req, res) => {
  const user = req?.user;
  if (user) {
    throw new ApiError(401, "Cannot create user while being logged in");
  }
  const { username, email, password } = req.body;

  //  Check if user already exists
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser)
    throw new ApiError(409, "User with email or username already exists");

  //  Apply rate limiting to prevent OTP spamming
  const ratelimitKey = `register:ratelimit:${email}`;
  if (await redisClient.get(ratelimitKey))
    throw new ApiError(429, "Too many OTP requests. Please try again later.");

  //  Generate OTP
  const otp = generateOTP();

  // Temporarily store user data and OTP in Redis (5 minutes)
  await redisClient.set(
    `register:${email}`,
    JSON.stringify({ username, email, password, otp }),
    "EX",
    300,
  );

  //  Set rate limit cooldown (1 minute)
  await redisClient.set(ratelimitKey, "true", "EX", 60);

  //  Send OTP email by adding in Email Queue BullMQ
  const intro =
    "Welcome to BaatCheet! We're very excited to have you on board.";
  emailQueue.add("sendMail", {
    email,
    subject: "OTP Verification",
    mailGenContent: OTPVerificationMailGenContent(username, intro, otp),
  });

  //  Success response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "OTP sent to your email."));
});

// ===================== VERIFY OTP =====================
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) throw new ApiError(404, "Email or OTP missing");

  //  Get temp user data from Redis
  const tempUserData = await redisClient.get(`register:${email}`);
  if (!tempUserData) throw new ApiError(400, "OTP expired or invalid");

  const parsedUserData = JSON.parse(tempUserData);

  // Match OTP
  if (parsedUserData.otp !== otp) throw new ApiError(400, "Invalid OTP");

  //  Ensure user doesn't already exist
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    await redisClient.del(`register:${email}`);
    throw new ApiError(400, "User already exists");
  }

  //  Hash password after OTP verification
  const hashedPassword = await bcrypt.hash(parsedUserData.password, 10);

  //  Create verified user in MongoDB
  const newUser = await User.create({
    username: parsedUserData.username,
    email: parsedUserData.email,
    password: hashedPassword,
    isVerified: true,
    status: "online",
  });

  // Generate JWTs
  const accessToken = newUser.createAccessToken();
  const refreshToken = newUser.createRefreshToken();

  //  Hash and store refresh token in Redis (7 days)
  const hashedRefresh = hashRefreshToken(refreshToken);
  await redisClient.set(
    `refresh:${newUser._id}`,
    hashedRefresh,
    "EX",
    7 * 24 * 60 * 60,
  );

  //  Cleanup temp Redis data
  await redisClient.del(`register:${email}`);
  await redisClient.del(`register:ratelimit:${email}`);

  //  Send cookies
  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  //  Final response
  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          isVerified: newUser.isVerified,
        },
      },
      "User verified and logged in successfully.",
    ),
  );
});

//==================RESEND EMAIL VERIFICATION OTP================
const resendEmailVerificationOTP = asyncHandler(async (req, res) => {
  //  Apply rate limiting to prevent OTP spamming
  const { email, username, password } = req.body;
  const ratelimitKey = `register:ratelimit:${email}`;
  if (await redisClient.get(ratelimitKey))
    throw new ApiError(429, "Too many OTP requests. Please try again later.");

  //  Generate OTP
  const otp = generateOTP();

  // Temporarily store user data and OTP in Redis (5 minutes)
  await redisClient.set(
    `register:${email}`,
    JSON.stringify({ username, email, password, otp }),
    "EX",
    300,
  );

  //  Set rate limit cooldown (1 minute)
  await redisClient.set(ratelimitKey, "true", "EX", 60);

  //  Send OTP email by adding in Email Queue BullMQ
  const intro =
    "Welcome to BaatCheet! We're very excited to have you on board.";
  emailQueue.add("sendMail", {
    email,
    subject: "OTP Verification",
    mailGenContent: OTPVerificationMailGenContent(username, intro, otp),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "OTP sent to your email."));
});

// ===================== LOGIN USER ===============================
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //  Check user existence
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  //  Verify account
  if (!user.isVerified) throw new ApiError(400, "Account not verified");

  //  Validate password
  const isValidPassword = await user.validatePassword(password);
  if (!isValidPassword) throw new ApiError(400, "Incorrect password");

  //  Generate tokens
  const accessToken = user.createAccessToken();
  const refreshToken = user.createRefreshToken();

  //  Store hashed refresh token in Redis (7 days)
  const hashedRefresh = hashRefreshToken(refreshToken);
  await redisClient.set(
    `refresh:${user._id}`,
    hashedRefresh,
    "EX",
    7 * 24 * 60 * 60,
  );

  //  Set cookies
  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  // Success response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified,
        },
      },
      "User logged in successfully.",
    ),
  );
});

// ===================== LOGOUT USER =====================
const logoutUser = asyncHandler(async (req, res) => {
  const { id, email } = req.user;

  // setting status of user to offline after logout
  await User.findByIdAndUpdate(id, { status: "offline", lastSeen: new Date() });

  //  Delete refresh token from Redis (invalidate session)
  await redisClient.del(`refresh:${id}`);

  //  Clear cookies
  res
    .clearCookie("accessToken", accessCookieOptions)
    .clearCookie("refreshToken", refreshCookieOptions);

  //  Send response
  return res
    .status(200)
    .json(new ApiResponse(200, null, `User ${email} logged out successfully.`));
});

//---------------REFRESH THE ACCESS TOKEN AFTER 15MINS-----------------

const refreshToken = asyncHandler(async (req, res) => {
  // get the refresh token from the cookies
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, "No Refresh Token Found");
  }
  // verify the refresh token
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  const userId = decoded?._id;
  if (!userId) throw new ApiError(401, "Invalid refresh token payload");

  // now get the hashedRefreshToken from the redis
  const storedHashedToken = await redisClient.get(`refresh:${userId}`);
  if (!storedHashedToken)
    throw new ApiError(403, "Session expired, please log in again");

  // create the hashedRefreshToken
  const hashedRefreshToken = hashRefreshToken(refreshToken);
  if (storedHashedToken !== hashedRefreshToken) {
    throw new ApiError(
      403,
      "Invalid refresh token, possible token reuse attack",
    );
  }

  // now get the user using the userId

  const user = await User.findById(userId).select("-password");
  if (!user) throw new ApiError(404, "User not found");

  // create the accessToken
  const newAccessToken = user.createAccessToken();

  res.cookie("accessToken", newAccessToken, accessCookieOptions);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Access token refreshed successfully"));
});

//----------------FORGOT PASSWORD--------------------------------
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const ratelimitKey = `reset:rateLimit:${email}`;
  if (await redisClient.get(ratelimitKey))
    throw new ApiError(429, "Too many OTP requests. Try again later");

  const otp = generateOTP();

  await redisClient.set(`reset:${email}`, JSON.stringify({ otp }), "EX", 300);
  await redisClient.set(ratelimitKey, "true", "EX", 60);

  const intro = "Use this OTP to reset your BaatCheet account password";

  emailQueue.add("sendResetPasswordMail", {
    email,
    subject: "Reset Password OTP",
    mailGenContent: OTPVerificationMailGenContent(user.username, intro, otp),
  });

  return res.status(200).json(new ApiResponse(200, null, "OTP sent to email"));
});

//----------------VERIFY FORGOT PASSWORD OTP--------------------------
const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
  const { email, password, otp } = req.body;

  if (!email || !password || !otp)
    throw new ApiError(400, "Email, OTP and Password are required");

  const redisData = await redisClient.get(`reset:${email}`);
  if (!redisData) throw new ApiError(400, "OTP expired or invalid");

  const { otp: savedOtp } = JSON.parse(redisData);

  if (savedOtp !== otp) throw new ApiError(400, "Invalid OTP");

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update password in DB
  await User.findOneAndUpdate(
    { email },
    {
      password: hashedPassword,
    },
  );

  // cleanup redis
  await redisClient.del(`reset:${email}`);
  await redisClient.del(`reset:rateLimit:${email}`);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset successfully"));
});

export {
  registerUser,
  verifyOtp,
  resendEmailVerificationOTP,
  loginUser,
  logoutUser,
  refreshToken,
  forgotPassword,
  verifyForgotPasswordOtp,
};

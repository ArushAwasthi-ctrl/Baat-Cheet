import bcrypt from "bcrypt"; // encrypt password
import crypto from "crypto"; // hash refreshtoken
import jwt from "jsonwebtoken";
import User from "../models/Users.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/asyncHandler.js";
import { redisClient } from "../redis/redisClient.js";
import { sendEmail, OTPVerificationMailGenContent } from "../utils/mailgen.js";

// function to generate a random 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ===================== REGISTER USER =====================
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // check if User Already exists in MongoDB
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists", []);
  }

  // check for rate-limit to prevent spam requests
  const ratelimitkey = `register:ratelimit:${email}`;
  const ratelimit = await redisClient.get(ratelimitkey);
  if (ratelimit) {
    throw new ApiError(
      429,
      { username, email },
      "Too many OTP requests, Please wait before requesting again.",
    );
  }

  // generate OTP
  const otp = generateOTP();

  // cache user data temporarily in redis (valid for 5 mins)
  await redisClient.set(
    `register:${email}`,
    JSON.stringify({ username, email, password, otp }),
    { EX: 300 }, // expires in 5 minutes
  );

  // set rate limit for 1 minute (prevents immediate re-request)
  await redisClient.set(ratelimitkey, "true", {
    EX: 60,
  });

  // send OTP email to user using Mailgen
  await sendEmail({
    email,
    subject: "OTP Verification",
    mailGenContent: OTPVerificationMailGenContent(username, otp),
  });

  // respond back to client
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "User temporarily saved in Redis and a verification email has been sent to verify OTP (valid for 5 mins).",
      ),
    );
});

// ===================== VERIFY OTP =====================
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new ApiError(404, "Credentials Not Found");
  }

  // get the temporary user data from redis
  const tempUserData = await redisClient.get(`register:${email}`);
  console.log(tempUserData);

  if (!tempUserData) {
    throw new ApiError(400, "OTP Expired or Invalid");
  }

  // parse user data from redis
  const parsedUserData = JSON.parse(tempUserData);

  // compare OTP
  if (parsedUserData.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  // check again if user already exists in MongoDB
  const user = await User.findOne({ email });
  if (user) {
    await redisClient.del(`register:${email}`);
    throw new ApiError(400, "User Already Exists");
  }

  // hash password during verification (only after OTP is confirmed)
  const hashedPassword = await bcrypt.hash(parsedUserData.password, 10);

  // create verified user in MongoDB
  const newUser = await User.create({
    username: parsedUserData.username,
    email: parsedUserData.email,
    password: hashedPassword,
    isVerified: true,
  });

  // ===================== JWT TOKENS =====================

  // generate access token and refresh token
  const accessToken = newUser.createAccessToken();
  const refreshToken = newUser.createRefreshToken();

  // hash the refresh token before storing in Redis (for security)
  const hashedRefresh = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  // save hashed refresh token in Redis (expiry 7 days)
  await redisClient.set(`refresh:${newUser._id}`, hashedRefresh, {
    EX: 7 * 24 * 60 * 60, // 7 days
  });

  // delete temporary redis data and rate limiter keys
  await redisClient.del(`register:${email}`);
  await redisClient.del(`register:ratelimit:${email}`);

  // ===================== SET COOKIES =====================
  const isProd = process.env.NODE_ENV === "production";

  // set access token cookie (valid for 15 min)
  res.cookie("accessToken", accessToken, {
    httpOnly: true, // Protects against XSS
    secure: isProd, // Send only over HTTPS in production
    sameSite: "strict", // Protects against CSRF
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // set refresh token cookie (valid for 7 days)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // final response
  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          isVerified: newUser.isVerified,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      },
      "User verified, created, and logged in successfully",
    ),
  );
});

export { registerUser, verifyOtp };

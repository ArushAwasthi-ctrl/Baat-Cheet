import { Router } from "express";

import {
  userRegisterValidator,
  userLoginValidator,
} from "../validators/validate.js";

import validate from "../middlewares/validator-middleware.js";

import {
  registerUser,
  verifyOtp,
  loginUser,
  logoutUser,
  refreshToken,
} from "../controllers/auth-controller.js";

import authValidator from "../middlewares/auth-middleware.js";

const Authrouter = new Router();

//  Register route with validation middleware
Authrouter.route("/register").post(
  userRegisterValidator(),
  validate,
  registerUser
);

//  Verify OTP route
Authrouter.route("/verify-otp").post(verifyOtp);

// Login route
Authrouter.route("/login").post(userLoginValidator(), validate, loginUser);

//  Logout route (protected)
Authrouter.route("/logout").get(authValidator, logoutUser);

//  Refresh token route (use POST, not GET)
Authrouter.route("/refresh").post(refreshToken);

export default Authrouter;

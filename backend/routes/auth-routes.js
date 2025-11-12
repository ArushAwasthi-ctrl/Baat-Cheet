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
} from "../controllers/auth-controller.js";

import authValidator from "../middlewares/auth-middleware.js";

const Authrouter = new Router();

Authrouter.route("/register").post(
  userRegisterValidator(),
  validate,
  registerUser,
);

Authrouter.route("/verify-otp").post(verifyOtp);

Authrouter.route("/login").post(userLoginValidator(), validate, loginUser);

Authrouter.route("/logout").get(authValidator, logoutUser);
export default Authrouter;

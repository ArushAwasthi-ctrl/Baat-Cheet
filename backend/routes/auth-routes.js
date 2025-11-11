import { Router } from "express";
import {
  userRegisterValidator,
  userLoginValidator,
} from "../validators/validate.js";
import validate from "../middlewares/validator-middleware.js";
import { registerUser ,verifyOtp} from "../controllers/auth-controller.js";
const Authrouter = new Router();
Authrouter.route("/register").post(
  userRegisterValidator(),
  validate,
  registerUser,
);
Authrouter.route("/verify-otp").post(verifyOtp)
export default Authrouter;

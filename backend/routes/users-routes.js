import { Router } from "express";
import authValidator from "../middlewares/auth-middleware.js";
import {
  getCurrentUser,
  getAllUsers,
  getIndividualUser,
  updateProfile,
  deleteAccount,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from "../controllers/users-controller.js";
import {
  userUpdateProfileValidator,
  friendUserIdValidator,
} from "../validators/validate.js";
import validate from "../middlewares/validator-middleware.js";
import { sensitiveOpLimiter } from "../middlewares/rate-limiter.js";
const UserRouter = Router();

// GET current logged-in user
UserRouter.route("/me").get(authValidator, getCurrentUser);

// DELETE current user account
UserRouter.route("/me").delete(authValidator, sensitiveOpLimiter, deleteAccount);

// GET all users (search + pagination)
UserRouter.route("/").get(authValidator, getAllUsers);

// GET Individual User based on id  Query params
UserRouter.route("/:id").get(authValidator, getIndividualUser);

// UPDATE user username , bio ,avatar
UserRouter.route("/profile").put(
  authValidator,
  userUpdateProfileValidator(),
  validate,
  updateProfile,
);

// Block / Unblock
UserRouter.post(
  "/block/:userId",
  authValidator,
  friendUserIdValidator(),
  validate,
  blockUser
);

UserRouter.delete(
  "/block/:userId",
  authValidator,
  friendUserIdValidator(),
  validate,
  unblockUser
);

UserRouter.get("/blocked", authValidator, getBlockedUsers);

// EXPORT AT THE END
export default UserRouter;

import { Router } from "express";
import authValidator from "../middlewares/auth-middleware.js";
import {
  getCurrentUser,
  getAllUsers,
  getIndividualUser,
  updateProfile,
} from "../controllers/users-controller.js";
import { userUpdateProfileValidator } from "../validators/validate.js";
import validate from "../middlewares/validator-middleware.js";
const UserRouter = Router();

// GET current logged-in user
UserRouter.route("/me").get(authValidator, getCurrentUser);

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

// EXPORT AT THE END
export default UserRouter;

import { Router } from "express";
import authValidator from "../middlewares/auth-middleware.js";
import {
  getCurrentUser,
  getAllUsers,
} from "../controllers/users-controller.js";

const UserRouter = Router();

// GET current logged-in user
UserRouter.get("/me", authValidator, getCurrentUser);

// GET all users (search + pagination)
UserRouter.get("/", authValidator, getAllUsers);

// EXPORT AT THE END
export default UserRouter;

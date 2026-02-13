import { Router } from "express";
import authValidator from "../middlewares/auth-middleware.js";
import validate from "../middlewares/validator-middleware.js";
import {
  friendRequestValidator,
  friendRequestIdValidator,
  friendUserIdValidator,
} from "../validators/validate.js";
import {
  sendFriendRequest,
  getReceivedRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
} from "../controllers/friends-controller.js";

const FriendRouter = Router();

// POST /api/friends/request - Send friend request
FriendRouter.post(
  "/request",
  authValidator,
  friendRequestValidator(),
  validate,
  sendFriendRequest
);

// GET /api/friends/requests/received - Get incoming requests
FriendRouter.get("/requests/received", authValidator, getReceivedRequests);

// GET /api/friends/requests/sent - Get outgoing requests
FriendRouter.get("/requests/sent", authValidator, getSentRequests);

// POST /api/friends/accept/:requestId - Accept request
FriendRouter.post(
  "/accept/:requestId",
  authValidator,
  friendRequestIdValidator(),
  validate,
  acceptFriendRequest
);

// POST /api/friends/reject/:requestId - Reject request
FriendRouter.post(
  "/reject/:requestId",
  authValidator,
  friendRequestIdValidator(),
  validate,
  rejectFriendRequest
);

// DELETE /api/friends/:userId - Remove friend
FriendRouter.delete(
  "/:userId",
  authValidator,
  friendUserIdValidator(),
  validate,
  removeFriend
);

// GET /api/friends - Get friends list
FriendRouter.get("/", authValidator, getFriends);

export default FriendRouter;

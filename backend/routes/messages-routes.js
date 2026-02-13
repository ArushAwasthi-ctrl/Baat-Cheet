import { Router } from "express";
import authValidator from "../middlewares/auth-middleware.js";
import validate from "../middlewares/validator-middleware.js";
import {
  sendMessageValidator,
  getMessagesValidator,
  markMessagesReadValidator,
  editMessageValidator,
  deleteMessageValidator,
  reactionValidator,
  searchMessagesValidator,
} from "../validators/validate.js";
import {
  sendMessage,
  getMessages,
  markMessagesRead,
  editMessage,
  deleteMessage,
  toggleReaction,
  searchMessages,
} from "../controllers/messages-controller.js";
import { messageUpload } from "../config/cloudinary.js";

const MessageRouter = new Router();

// POST /api/messages - Send a message (with optional file uploads)
MessageRouter.post(
  "/",
  authValidator,
  messageUpload.array("files", 5),
  sendMessageValidator(),
  validate,
  sendMessage,
);

// GET /api/messages/search - Global search across all chats
MessageRouter.get(
  "/search",
  authValidator,
  searchMessagesValidator(),
  validate,
  searchMessages,
);

// GET /api/messages/:chatId/search - Search within a specific chat
MessageRouter.get(
  "/:chatId/search",
  authValidator,
  searchMessagesValidator(),
  validate,
  searchMessages,
);

// GET /api/messages/:chatId - Get paginated messages for a chat
MessageRouter.get(
  "/:chatId",
  authValidator,
  getMessagesValidator(),
  validate,
  getMessages,
);

// POST /api/messages/:chatId/mark-read - Mark messages as read
MessageRouter.post(
  "/:chatId/mark-read",
  authValidator,
  markMessagesReadValidator(),
  validate,
  markMessagesRead,
);

// PUT /api/messages/:messageId - Edit a message
MessageRouter.put(
  "/:messageId",
  authValidator,
  editMessageValidator(),
  validate,
  editMessage,
);

// DELETE /api/messages/:messageId - Soft delete a message
MessageRouter.delete(
  "/:messageId",
  authValidator,
  deleteMessageValidator(),
  validate,
  deleteMessage,
);

// POST /api/messages/:messageId/react - Toggle reaction on a message
MessageRouter.post(
  "/:messageId/react",
  authValidator,
  reactionValidator(),
  validate,
  toggleReaction,
);

export default MessageRouter;

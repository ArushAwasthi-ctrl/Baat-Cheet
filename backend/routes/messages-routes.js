import { Router } from "express";
import authValidator from "../middlewares/auth-middleware.js";
import validate from "../middlewares/validator-middleware.js";
import {
  sendMessageValidator,
  getMessagesValidator,
  markMessagesReadValidator,
} from "../validators/validate.js";
import {
  sendMessage,
  getMessages,
  markMessagesRead,
} from "../controllers/messages-controller.js";

const MessageRouter = new Router();

// POST /api/messages - Send a message
MessageRouter.post(
  "/",
  authValidator,
  sendMessageValidator(),
  validate,
  sendMessage,
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

export default MessageRouter;

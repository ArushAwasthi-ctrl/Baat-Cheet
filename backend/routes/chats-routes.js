import { Router } from "express";
import {
  createOrGetDirectChat,
  createorGetGroupChat,
  getChatById,
  getUserChats,
} from "../controllers/chats-controller.js";
import authValidator from "../middlewares/auth-middleware.js";
import validate from "../middlewares/validator-middleware.js";
import {
  createDirectChatValidator,
  createGroupChatValidator,
  getChatByIdValidator,
  getUserChatsValidator,
} from "../validators/validate.js";
const ChatRouter = new Router();

ChatRouter.post(
  "/",
  authValidator,
  createDirectChatValidator(),
  validate,
  createOrGetDirectChat,
);
ChatRouter.post(
  "/group",
  authValidator,
  createGroupChatValidator(),
  validate,
  createorGetGroupChat,
);
ChatRouter.get(
  "/",
  authValidator,
  getUserChatsValidator(),
  validate,
  getUserChats,
);
ChatRouter.get(
  "/:chatId",
  authValidator,
  getChatByIdValidator(),
  validate,
  getChatById,
);


export default ChatRouter;

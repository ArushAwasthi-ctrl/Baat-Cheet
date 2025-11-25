import { Router } from "express";
import {
  createOrGetDirectChat,
  createorGetGroupChat,
  getChatById,
  getUserChats,
  updateGroupInfo,
  addMembers,
  removeMembers,
} from "../controllers/chats-controller.js";
import authValidator from "../middlewares/auth-middleware.js";
import validate from "../middlewares/validator-middleware.js";
import {
  addMemberValidator,
  createDirectChatValidator,
  createGroupChatValidator,
  getChatByIdValidator,
  getUserChatsValidator,
  groupInfoValidator,
  removeMemberValidator,
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

ChatRouter.post(
  "/:chatId",
  authValidator,
  groupInfoValidator(),
  validate,
  updateGroupInfo,
);
ChatRouter.post(
  "/:chatId/members/add",
  authValidator,
  addMemberValidator(),
  validate,
  addMembers,
);
ChatRouter.post(
  "/:chatId/members/remove",
  authValidator,
  removeMemberValidator(),
  validate,
  removeMembers,
);
export default ChatRouter;

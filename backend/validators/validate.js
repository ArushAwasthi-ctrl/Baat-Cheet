import { body, param, query } from "express-validator";

const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),

    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long")
      .isLength({ max: 30 })
      .withMessage("Username must be at most 30 characters long"),

    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/\d/)
      .withMessage("Password must contain at least one number")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[!@#$%^&*]/)
      .withMessage("Password must contain at least one special character"),
  ];
};

const userLoginValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),

    body("password").trim().notEmpty().withMessage("Password is required"),
  ];
};
const userForgotPasswordValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
  ];
};
const userForgotPasswordOtpValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),

    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/\d/)
      .withMessage("Password must contain at least one number")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[!@#$%^&*]/)
      .withMessage("Password must contain at least one special character"),

    body("otp").trim().notEmpty(),
  ];
};
const userUpdateProfileValidator = () => {
  return [
    body("username")
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long")
      .isLength({ max: 30 })
      .withMessage("Username must be at most 30 characters long"),

    body("bio")
      .optional()
      .trim()
      .isLength({ max: 150 })
      .withMessage("Bio must be at most 150 characters long"),

    body("avatar")
      .optional()
      .trim()
      .isURL()
      .withMessage("Avatar must be a valid URL"),
  ];
};

const createDirectChatValidator = () => {
  return [
    body("userId")
      .trim()
      .notEmpty()
      .withMessage("userId is required")
      .isMongoId()
      .withMessage("userId must be a valid Mongo ID"),
  ];
};

const createGroupChatValidator = () => {
  return [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Group name is required")
      .isLength({ min: 3, max: 60 })
      .withMessage("Group name must be between 3 and 60 characters"),
    body("participants")
      .isArray({ min: 2 })
      .withMessage("At least 2 other members are required"),
    body("participants.*")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Participant IDs cannot be empty")
      .bail()
      .isMongoId()
      .withMessage("Participant IDs must be valid Mongo IDs"),
  ];
};

const getChatByIdValidator = () => {
  return [
    param("chatId")
      .trim()
      .isMongoId()
      .withMessage("chatId must be a valid Mongo ID"),
  ];
};

const getUserChatsValidator = () => {
  return [
    query("cursor")
      .optional()
      .isISO8601()
      .withMessage("cursor must be a valid ISO date string"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("limit must be between 1 and 50"),
  ];
};

const sendMessageValidator = () => {
  return [
    body("chatId")
      .trim()
      .notEmpty()
      .withMessage("chatId is required")
      .isMongoId()
      .withMessage("chatId must be a valid Mongo ID"),
    body("content")
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage("Content must be at most 5000 characters")
      .custom((value) => {
        if (value !== undefined && value.trim().length === 0) {
          throw new Error("Content cannot be empty or whitespace only");
        }
        return true;
      }),
    body("attachments")
      .optional()
      .isArray()
      .withMessage("attachments must be an array"),
    body("attachments.*.url")
      .optional()
      .isURL()
      .withMessage("Attachment URL must be valid"),
    body("attachments.*.type")
      .optional()
      .isIn(["image", "file"])
      .withMessage("Attachment type must be 'image' or 'file'"),
    body().custom((value) => {
      // At least one of content or attachments must exist
      if (
        !value.content?.trim() &&
        (!value.attachments || value.attachments.length === 0)
      ) {
        throw new Error("Message must have either content or attachments");
      }
      return true;
    }),
  ];
};

const getMessagesValidator = () => {
  return [
    param("chatId")
      .trim()
      .isMongoId()
      .withMessage("chatId must be a valid Mongo ID"),
    query("cursor")
      .optional()
      .isString()
      .withMessage("cursor must be a string (ObjectId or ISO date)"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("limit must be between 1 and 50"),
  ];
};

const markMessagesReadValidator = () => {
  return [
    param("chatId")
      .trim()
      .isMongoId()
      .withMessage("chatId must be a valid Mongo ID"),
    body("messageId")
      .optional()
      .trim()
      .isMongoId()
      .withMessage("messageId must be a valid Mongo ID"),
  ];
};

const groupInfoValidator = () => {
  return [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Name must be between 1 and 50 characters"),
    body("avatar")
      .optional()
      .trim()
      .isURL()
      .withMessage("Avatar must be a valid URL"),
  ];
};
const addMemberValidator = () => {
  return [
    param("chatId")
      .trim()
      .isMongoId()
      .withMessage("chatId must be a valid Mongo ID"),

    body("memberIds")
      .isArray({ min: 1 })
      .withMessage("memberIds must be a non-empty array"),

    body("memberIds.*")
      .trim()
      .isMongoId()
      .withMessage("Each memberId must be a valid Mongo ID"),
  ];
};
const removeMemberValidator = () => {
  return [
    param("chatId")
      .trim()
      .isMongoId()
      .withMessage("chatId must be a valid Mongo ID"),
    body("memberIds")
      .isArray({ min: 1 })
      .withMessage("memberIds must be a non-empty array"),
    body("memberIds.*")
      .trim()
      .isMongoId()
      .withMessage("Each memberId must be a valid Mongo ID"),
  ];
};

const promoteToAdminValidator = () => {
  return [
    param("chatId")
      .trim()
      .isMongoId()
      .withMessage("chatId must be a valid Mongo ID"),
    body("memberId")
      .trim()
      .notEmpty()
      .withMessage("memberId is required")
      .isMongoId()
      .withMessage("memberId must be a valid Mongo ID"),
  ];
};

// ==================== FRIEND VALIDATORS ====================

const friendRequestValidator = () => {
  return [
    body("userId")
      .trim()
      .notEmpty()
      .withMessage("userId is required")
      .isMongoId()
      .withMessage("userId must be a valid Mongo ID"),
  ];
};

const friendRequestIdValidator = () => {
  return [
    param("requestId")
      .trim()
      .isMongoId()
      .withMessage("requestId must be a valid Mongo ID"),
  ];
};

const friendUserIdValidator = () => {
  return [
    param("userId")
      .trim()
      .isMongoId()
      .withMessage("userId must be a valid Mongo ID"),
  ];
};

// ==================== AI VALIDATORS ====================

const summaryValidator = () => {
  return [
    body("chatId")
      .trim()
      .notEmpty()
      .withMessage("chatId is required")
      .isMongoId()
      .withMessage("chatId must be a valid Mongo ID"),
  ];
};

const aiChatValidator = () => {
  return [
    body("chatId")
      .trim()
      .notEmpty()
      .withMessage("chatId is required")
      .isMongoId()
      .withMessage("chatId must be a valid Mongo ID"),
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Message content is required")
      .isLength({ max: 2000 })
      .withMessage("Message must be at most 2000 characters"),
  ];
};

// ==================== MESSAGE EDIT/DELETE/REACTION/SEARCH VALIDATORS ====================

const editMessageValidator = () => {
  return [
    param("messageId")
      .trim()
      .isMongoId()
      .withMessage("messageId must be a valid Mongo ID"),
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Content is required")
      .isLength({ max: 5000 })
      .withMessage("Content must be at most 5000 characters"),
  ];
};

const deleteMessageValidator = () => {
  return [
    param("messageId")
      .trim()
      .isMongoId()
      .withMessage("messageId must be a valid Mongo ID"),
  ];
};

const reactionValidator = () => {
  return [
    param("messageId")
      .trim()
      .isMongoId()
      .withMessage("messageId must be a valid Mongo ID"),
    body("emoji")
      .trim()
      .notEmpty()
      .withMessage("Emoji is required"),
  ];
};

const searchMessagesValidator = () => {
  return [
    query("q")
      .trim()
      .notEmpty()
      .withMessage("Search query is required")
      .isLength({ max: 200 })
      .withMessage("Search query too long"),
    query("cursor").optional().isMongoId().withMessage("Invalid cursor"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("limit must be between 1 and 50"),
  ];
};

export {
  userRegisterValidator,
  userLoginValidator,
  userForgotPasswordValidator,
  userForgotPasswordOtpValidator,
  userUpdateProfileValidator,
  createDirectChatValidator,
  createGroupChatValidator,
  getChatByIdValidator,
  getUserChatsValidator,
  sendMessageValidator,
  getMessagesValidator,
  markMessagesReadValidator,
  groupInfoValidator,
  addMemberValidator,
  removeMemberValidator,
  promoteToAdminValidator,
  friendRequestValidator,
  friendRequestIdValidator,
  friendUserIdValidator,
  editMessageValidator,
  deleteMessageValidator,
  reactionValidator,
  searchMessagesValidator,
  summaryValidator,
  aiChatValidator,
};

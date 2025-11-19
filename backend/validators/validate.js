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
};

import { Router } from "express";
import authValidator from "../middlewares/auth-middleware.js";
import validate from "../middlewares/validator-middleware.js";
import { summaryValidator } from "../validators/validate.js";
import { requestCatchUpSummary } from "../controllers/ai-controller.js";

const AIRouter = new Router();

// POST /api/ai/summary - Request a catch-up summary of unread messages
AIRouter.post(
  "/summary",
  authValidator,
  summaryValidator(),
  validate,
  requestCatchUpSummary,
);

export default AIRouter;

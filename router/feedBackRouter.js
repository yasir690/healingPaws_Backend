import { Router } from "express";

import * as feedBackController from "../controller/feedBackController.js";

import auth from "../middleware/auth.js";

export const feedBackRouter = Router();
import limiter from "../middleware/throttleservice.js";

feedBackRouter.post(
  "/userFeedBack",
  limiter,
  auth,
  feedBackController.userFeedBack
);

feedBackRouter.post(
  "/handlerFeedBack",
  limiter,
  auth,
  feedBackController.handlerFeedBack
);

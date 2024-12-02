import { Router } from "express";

import * as chatController from "../controller/chatController.js";

import auth from "../middleware/auth.js";

export const chatRouter = Router();
import limiter from "../middleware/throttleservice.js";

chatRouter.post(
  "/createChatRoom",
  limiter,
  auth,
  chatController.createChatRoom
);

chatRouter.get("/getChatRooms", limiter, auth, chatController.getChatRooms);

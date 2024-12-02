import { Router } from "express";

import auth from "../middleware/auth.js";

import * as userNotificationController from "../controller/userNotificationController.js";

export const userNotificationRouter = Router();
import limiter from "../middleware/throttleservice.js";

userNotificationRouter.get(
  "/getAllUserNotification",
  limiter,
  auth,
  userNotificationController.getAllUserNotification
);

userNotificationRouter.put(
  "/userReadNotification/:userNotificationId",
  limiter,
  auth,
  userNotificationController.userReadNotification
);

userNotificationRouter.put(
  "/onAndOffUserNotification",
  limiter,
  auth,
  userNotificationController.onAndOffUserNotification
);

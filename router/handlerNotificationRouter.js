import { Router } from "express";

import auth from "../middleware/auth.js";

import * as handlerNotificationController from "../controller/handlerNotificationController.js";

export const handlerNotificationRouter = Router();

import limiter from "../middleware/throttleservice.js";

handlerNotificationRouter.get(
  "/getAllHandlerNotification",
  limiter,
  auth,
  handlerNotificationController.getAllHandlerNotification
);

handlerNotificationRouter.put(
  "/handlerReadNotification/:handlerNotificationId",
  limiter,
  auth,
  handlerNotificationController.handlerReadNotification
);

handlerNotificationRouter.put(
  "/onAndOffHandlerNotification",
  limiter,
  auth,
  handlerNotificationController.onAndOffHandlerNotification
);

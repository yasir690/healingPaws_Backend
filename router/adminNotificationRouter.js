import { Router } from "express";

import auth from "../middleware/auth.js";
import * as adminNotificationController from "../controller/adminNotificationController.js";
export const adminNotificationRouter = Router();
import limiter from "../middleware/throttleservice.js";

adminNotificationRouter.get(
  "/getAllAdminNotification",
  limiter,
  auth,
  adminNotificationController.getAllAdminNotification
);

adminNotificationRouter.put(
  "/adminReadNotification/:Id",
  limiter,
  auth,
  adminNotificationController.adminReadNotification
);

adminNotificationRouter.put(
  "/onAndOffAdminNotification",
  limiter,
  auth,
  adminNotificationController.onAndOffAdminNotification
);

import { Router } from "express";

import auth from "../middleware/auth.js";
import * as adminController from "../controller/adminController.js";
export const adminRouter = Router();
import limiter from "../middleware/throttleservice.js";

adminRouter.post("/adminRegister", adminController.adminRegister);

adminRouter.post("/adminLogin", adminController.adminLogin);

adminRouter.post(
  "/createUserTermsAndCondition",
  limiter,
  auth,
  adminController.createUserTermsAndCondition
);

adminRouter.get(
  "/getUsersTermsAndCondition",
  limiter,
  auth,
  adminController.getUsersTermsAndCondition
);

adminRouter.put(
  "/updateUserTermsAndCondition/:id",
  limiter,
  auth,
  adminController.updateUserTermsAndCondition
);

adminRouter.post(
  "/createHandlerTermsAndCondition",
  limiter,
  auth,
  adminController.createHandlerTermsAndCondition
);

adminRouter.get(
  "/getHandlersTermsAndCondition",
  limiter,
  auth,
  adminController.getHandlersTermsAndCondition
);

adminRouter.put(
  "/updateHandlerTermsAndCondition/:id",
  limiter,
  auth,
  adminController.updateHandlerTermsAndCondition
);

adminRouter.post(
  "/createUserPrivacyPolicy",
  limiter,
  auth,
  adminController.createUserPrivacyPolicy
);

adminRouter.get(
  "/getUsersPrivacyPolicy",
  limiter,
  auth,
  adminController.getUsersPrivacyPolicy
);

adminRouter.put(
  "/updateUserPrivacyPolicy/:id",
  limiter,
  auth,
  adminController.updateUserPrivacyPolicy
);

adminRouter.post(
  "/createHandlerPrivacyPolicy",
  limiter,
  auth,
  adminController.createHandlerPrivacyPolicy
);

adminRouter.get(
  "/getHandlersPrivacyPolicy",
  limiter,
  auth,
  adminController.getHandlersPrivacyPolicy
);

adminRouter.put(
  "/updateHandlerPrivacyPolicy/:id",
  limiter,
  auth,
  adminController.updateHandlerPrivacyPolicy
);

adminRouter.post(
  "/createUserAboutApp",
  limiter,
  auth,
  adminController.createUserAboutApp
);

adminRouter.get(
  "/getUsersAboutApp",
  limiter,
  auth,
  adminController.getUsersAboutApp
);

adminRouter.put(
  "/updateUserAboutApp/:id",
  limiter,
  auth,
  adminController.updateUserAboutApp
);

adminRouter.post(
  "/createHandlerAboutApp",
  limiter,
  auth,
  adminController.createHandlerAboutApp
);

adminRouter.get(
  "/getHandlersAboutApp",
  limiter,
  auth,
  adminController.getHandlersAboutApp
);

adminRouter.put(
  "/updateHandlerAboutApp/:id",
  limiter,
  auth,
  adminController.updateHandlerAboutApp
);

adminRouter.post(
  "/createUserRefundPolicy",
  limiter,
  auth,
  adminController.createUserRefundPolicy
);

adminRouter.get(
  "/getUsersRefundPolicy",
  limiter,
  auth,
  adminController.getUsersRefundPolicy
);

adminRouter.get(
  "/getUserRefundRequest",
  limiter,
  auth,
  adminController.getUserRefundRequest
);

adminRouter.put(
  "/updateUserRefundPolicy/:id",
  limiter,
  auth,
  adminController.updateUserRefundPolicy
);

adminRouter.post(
  "/createHandlerRefundPolicy",
  limiter,
  auth,
  adminController.createHandlerRefundPolicy
);

adminRouter.get(
  "/getHandlersRefundPolicy",
  limiter,
  auth,
  adminController.getHandlersRefundPolicy
);

adminRouter.put(
  "/updateHandlerRefundPolicy/:id",
  limiter,
  auth,
  adminController.updateHandlerRefundPolicy
);

adminRouter.get(
  "/getUserAndHandlerFeedBack",
  limiter,
  auth,
  adminController.getUserAndHandlerFeedBack
);

adminRouter.get(
  "/getAndroidAndIosUser",
  limiter,
  auth,
  adminController.getAndroidAndIosUsers
);

adminRouter.get("/totalUsers", limiter, auth, adminController.totalUsers);

adminRouter.get("/getAllUsers", limiter, auth, adminController.getAllUsers);

adminRouter.delete(
  "/deleteUser/:userId",
  limiter,
  auth,
  adminController.deleteUser
);

adminRouter.get(
  "/getAllHandlers",
  limiter,
  auth,
  adminController.getAllHandlers
);

adminRouter.delete(
  "/deleteHandler/:handlerId",
  limiter,
  auth,
  adminController.deleteHandler
);

// adminRouter.post('/sendNotification',auth,adminController.sendNotification);

adminRouter.get(
  "/getAllNewBooking",
  limiter,
  auth,
  adminController.getAllNewBooking
);

adminRouter.get(
  "/getAllCompletedBooking",
  limiter,
  auth,
  adminController.getAllCompletedBooking
);

adminRouter.get(
  "/getAllRefundBooking",
  limiter,
  auth,
  adminController.getAllRefundBooking
);

adminRouter.post(
  "/adminRefundToUser",
  limiter,
  auth,
  adminController.adminRefundToUser
);

adminRouter.put(
  "/deviceTokenSave",
  limiter,
  auth,
  adminController.deviceTokenSave
);

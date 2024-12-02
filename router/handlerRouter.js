import { Router } from "express";

import * as handlerController from "../controller/handlerAuthController.js";

export const handlerRouter = Router();

import auth from "../middleware/auth.js";
import limiter from "../middleware/throttleservice.js";

handlerRouter.post("/handlerSignIn", handlerController.handlerSignIn);

handlerRouter.post("/verifyOtpHandler", handlerController.verifyOtpHandler);

handlerRouter.post(
  "/handlerCreateProfile",
  limiter,
  auth,
  handlerController.handlerCreateProfile
);

handlerRouter.put(
  "/handlerEditProfile",
  limiter,
  auth,
  handlerController.handlerEditProfile
);

handlerRouter.post(
  "/handlerSocialLogin",
  limiter,
  handlerController.handlerSocialLogin
);

handlerRouter.get(
  "/getHandlerProfile",
  limiter,
  auth,
  handlerController.getHandlerProfile
);

handlerRouter.post(
  "/addBusinessBankAccount",
  limiter,
  auth,
  handlerController.addBusinessBankAccount
);

handlerRouter.get(
  "/getBusinessBankAccount",
  limiter,
  auth,
  handlerController.getBusinessBankAccount
);

handlerRouter.delete(
  "/handlerDeleteAccount",
  limiter,
  auth,
  handlerController.handlerDeleteAccount
);

handlerRouter.get(
  "/success/:accountId",
  handlerController.verificationBusinessAccount
);

handlerRouter.post("/resendOtpHandler", handlerController.resendOtpHandler);

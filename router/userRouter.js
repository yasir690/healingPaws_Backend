import { Router } from "express";

import * as userController from "../controller/userAuthController.js";

export const userRouter = Router();

import auth from "../middleware/auth.js";
import limiter from "../middleware/throttleservice.js";

userRouter.post("/userSignIn", userController.userSignIn);

userRouter.post("/verifyOtpUser", userController.verifyOtpUser);

userRouter.post(
  "/userCreateProfile",
  limiter,
  auth,
  userController.userCreateProfile
);

userRouter.put(
  "/editUserProfile",
  limiter,
  auth,
  userController.editUserProfile
);

userRouter.post("/userSocialLogin", limiter, userController.userSocialLogin);

userRouter.get("/getUserProfile", limiter, auth, userController.getUserProfile);

userRouter.delete(
  "/userDeleteAccount",
  limiter,
  auth,
  userController.userDeleteAccount
);

userRouter.post("/resendOtpUser", limiter, userController.resendOtpUser);

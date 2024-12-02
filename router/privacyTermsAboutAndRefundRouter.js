import { Router } from "express";

import * as privacyTermsAboutAndRefundController from "../controller/privacyTermsAboutAndRefundController.js";

import auth from "../middleware/auth.js";

export const privacyTermsAboutAndRefundRouter = Router();
import limiter from "../middleware/throttleservice.js";

privacyTermsAboutAndRefundRouter.get(
  "/getUserPrivacyPolicy",
  limiter,
  auth,
  privacyTermsAboutAndRefundController.getUserPrivacyPolicy
);

privacyTermsAboutAndRefundRouter.get(
  "/getUserTermsAndCondition",
  limiter,
  auth,
  privacyTermsAboutAndRefundController.getUserTermsAndCondition
);

privacyTermsAboutAndRefundRouter.get(
  "/getUserAboutApp",
  limiter,
  auth,
  privacyTermsAboutAndRefundController.getUserAboutApp
);

privacyTermsAboutAndRefundRouter.get(
  "/getUserRefundPolicy",
  limiter,
  auth,
  privacyTermsAboutAndRefundController.getUserRefundPolicy
);

privacyTermsAboutAndRefundRouter.get(
  "/getHandlerPrivacyPolicy",
  limiter,
  auth,
  privacyTermsAboutAndRefundController.getHandlerPrivacyPolicy
);

privacyTermsAboutAndRefundRouter.get(
  "/getHandlerTermsAndCondition",
  limiter,
  auth,
  privacyTermsAboutAndRefundController.getHandlerTermsAndCondition
);

privacyTermsAboutAndRefundRouter.get(
  "/getHandlerAboutApp",
  limiter,
  auth,
  privacyTermsAboutAndRefundController.getHandlerAboutApp
);

privacyTermsAboutAndRefundRouter.get(
  "/getHandlerRefundPolicy",
  limiter,
  auth,
  privacyTermsAboutAndRefundController.getHandlerRefundPolicy
);

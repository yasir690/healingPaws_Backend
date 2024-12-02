import { Router } from "express";

import auth from "../middleware/auth.js";
import * as ratingReviewController from "../controller/reviewRatingController.js";
export const ratingReviewRouter = Router();
import limiter from "../middleware/throttleservice.js";

ratingReviewRouter.post(
  "/petsRatingReviewAndServiceRating",
  limiter,
  auth,
  ratingReviewController.petsRatingReviewAndServiceRating
);

ratingReviewRouter.get(
  "/overAllRatingPets/:petId",
  limiter,
  auth,
  ratingReviewController.overAllRatingPets
);

ratingReviewRouter.get(
  "/totalReviewPets/:petId",
  limiter,
  auth,
  ratingReviewController.totalReviewPets
);

ratingReviewRouter.get(
  "/overAllRatingService/:serviceId",
  limiter,
  auth,
  ratingReviewController.overAllRatingService
);

ratingReviewRouter.post(
  "/HandlerReply/:reviewId",
  limiter,
  auth,
  ratingReviewController.HandlerReply
);

ratingReviewRouter.get(
  "/getHandlerReply/:reviewId",
  limiter,
  auth,
  ratingReviewController.getHandlerReply
);

import { Router } from "express";
import * as discoverController from "../controller/discoverController.js";
import auth from "../middleware/auth.js";

export const discoverRouter = Router();
import limiter from "../middleware/throttleservice.js";

discoverRouter.post(
  "/likeDiscoverData",
  limiter,
  auth,
  discoverController.likeDiscoverData
);

discoverRouter.get(
  "/getLikeDiscoverData",
  limiter,
  auth,
  discoverController.getLikeDiscoverData
);

discoverRouter.get(
  "/getDiscoverDataByMiles",
  limiter,
  auth,
  discoverController.getDiscoverDataByMiles
);

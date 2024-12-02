import { Router } from "express";

import * as servicesController from "../controller/servicesController.js";

export const servicesRouter = Router();

import auth from "../middleware/auth.js";
import limiter from "../middleware/throttleservice.js";

servicesRouter.get(
  "/getAllServices",
  limiter,
  auth,
  servicesController.getAllServices
);

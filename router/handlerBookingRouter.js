import { Router } from "express";

import * as handlerBookingController from "../controller/handlerBookingController.js";

export const handlerBookingRouter = Router();

import auth from "../middleware/auth.js";

import limiter from "../middleware/throttleservice.js";

handlerBookingRouter.get(
  "/handlerNewBooking",
  limiter,
  auth,
  handlerBookingController.handlerNewBooking
);

handlerBookingRouter.get(
  "/HandlerBookingHistory",
  limiter,
  auth,
  handlerBookingController.HandlerBookingHistory
);

handlerBookingRouter.put(
  "/completeBooking/:bookingId",
  limiter,
  auth,
  handlerBookingController.completeBooking
);

handlerBookingRouter.get(
  "/getTodayAndWeeklyBooking",
  limiter,
  auth,
  handlerBookingController.getTodayAndWeeklyBooking
);

handlerBookingRouter.get(
  "/getAnalyticsByWeeklyMonthlyYearly",
  limiter,
  auth,
  handlerBookingController.getAnalyticsByWeeklyMonthlyYearly
);

handlerBookingRouter.get(
  "/myEarning",
  limiter,
  auth,
  handlerBookingController.myEarning
);

handlerBookingRouter.get(
  "/checkHandlerBalance",
  limiter,
  auth,
  handlerBookingController.checkHandlerBalance
);

handlerBookingRouter.post(
  "/withDrawAmountHandler",
  limiter,
  auth,
  handlerBookingController.withDrawAmountHandler
);

handlerBookingRouter.get(
  "/getAllTransaction",
  limiter,
  auth,
  handlerBookingController.getAllTransaction
);

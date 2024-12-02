import { Router } from "express";

import * as bookingController from "../controller/userBookingController.js";

export const userBookingRouter = Router();

import auth from "../middleware/auth.js";
import limiter from "../middleware/throttleservice.js";

userBookingRouter.post(
  "/userBookingService",
  limiter,
  auth,
  bookingController.userBookingService
);

userBookingRouter.get(
  "/userBookingHistory",
  limiter,
  auth,
  bookingController.userBookingHistory
);

userBookingRouter.get(
  "/userNewBooking",
  limiter,
  auth,
  bookingController.userNewBooking
);

userBookingRouter.put(
  "/reScheduleBooking/:bookingId",
  limiter,
  auth,
  bookingController.reScheduleBooking
);

userBookingRouter.post(
  "/reScheduleAppointment/:bookingId",
  limiter,
  auth,
  bookingController.reScheduleAppointment
);

userBookingRouter.post(
  "/refundBooking/:bookingId",
  limiter,
  auth,
  bookingController.refundBooking
);

userBookingRouter.get(
  "/userDebitServices",
  limiter,
  auth,
  bookingController.userDebitServices
);

userBookingRouter.get(
  "/userRefundServices",
  limiter,
  auth,
  bookingController.userRefundServices
);

userBookingRouter.get(
  "/userBalance",
  limiter,
  auth,
  bookingController.userBalance
);

userBookingRouter.post(
  "/deleteAccount",
  limiter,
  bookingController.deleteAccount
);

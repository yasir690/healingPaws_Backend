import stripe from "stripe";
const stripeInstance = stripe(process.env.STRIPE_KEY);
import paymentModel from "../model/paymentModel.js";
import adminModel from "../model/adminModel.js";
import adminNotificationModel from "../model/adminNotificationModel.js";
import pushNotification from "../middleware/pushNotification.js";
import handlerNotificationModel from "../model/handlerNotificationModel.js";
import bookingModel from "../model/bookingModel.js";

// Define the function to deduct commission and send payment to the handler
const processCommissionAndPayment = async (bookingId) => {
  try {
    console.log("processcommisionandpayment");
    const booking = await paymentModel
      .findOne({ bookingId: bookingId })
      .populate("handlerId");
    console.log(booking, "booking");
    if (!booking) {
      console.error("Booking not found for ID:", bookingId);
      return;
    }

    // Calculate commission and initiate payment transfer
    const TotalAmount = booking.pay;
    const adminCommissionPercentage = 0.2; // 20 % commission
    const adminCommission = TotalAmount * adminCommissionPercentage;
    const amountAfterCommission = TotalAmount - adminCommission;
    const amountInCents = Math.round(amountAfterCommission * 100);

    const metadata = { bookingId: bookingId };

    // Create a transfer to the handler's connected account
    const transfer = await stripeInstance.transfers.create({
      amount: amountInCents,
      currency: "usd",
      destination: booking.handlerId.handlerAccountId,
      metadata: metadata,
    });

    console.log(transfer, "transfer");
    // Update the payment record with commission deduction
    await paymentModel.findOneAndUpdate(
      { bookingId: bookingId },
      {
        $set: {
          amountAfterAdminDeduction: amountAfterCommission,
          isReceived: true,
        },
      },
      { new: true }
    );

    console.log(
      "Payment deducted and transferred successfully for booking:",
      bookingId
    );

    const findadmin = await adminModel.findOne().populate("auth");
    if (!findadmin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    //send notification to the admin

    const notificationObj = {
      deviceToken: findadmin.auth.deviceToken,
      title: "payment notification",
      body: `you have recieve payment`,
      auth: findadmin.auth,
    };

    const createNotification = new adminNotificationModel(notificationObj);
    const save = createNotification.save();

    try {
      await pushNotification(notificationObj);
    } catch (error) {
      console.log(error.message);
    }

    //notification send to the handler

    const notificationObjHandler = {
      deviceToken: booking.handlerId.auth.deviceToken,
      title: "payment notification",
      body: `you have recieve payment from ${findadmin.adminName}`,
      auth: booking.handlerId.auth,
    };

    const createNotificationHandler = new handlerNotificationModel(
      notificationObjHandler
    );
    const saveHandler = createNotificationHandler.save();

    try {
      await pushNotification(notificationObjHandler);
    } catch (error) {
      console.log(error.message);
    }
  } catch (error) {
    console.error("Error occurred while processing payment:", error.message);
  }
};

// Define the cron job to process commission deduction and payment transfer
export const scheduleCommissionAndPaymentProcessing = async () => {
  try {
    console.log("scheduleCommissionAndPaymentProcessing");

    // console.log(threeMinutesAgo,'twoMinutesAgo');
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // Find a single completed booking within the last 10 day ago
    const completedBooking = await paymentModel
      .findOne({
        completedAt: { $lte: tenDaysAgo }, // completedAt should be less than or equal to ten days ago
        isReceived: false, // Exclude bookings already processed
      })
      .populate("handlerId");

    console.log(completedBooking, "completedBooking");

    // If a completed booking is found, process commission deduction and payment transfer
    if (completedBooking) {
      console.log("completed booking");
      await processCommissionAndPayment(completedBooking.bookingId);
    } else {
      console.log(
        "No completed booking found within the specified time range."
      );
    }
  } catch (error) {
    console.error(
      "Error occurred while processing commission and payment:",
      error.message
    );
  }
};

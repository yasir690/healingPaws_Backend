import adminNotificationModel from "../model/adminNotificationModel.js";
import authModel from "../model/authModel.js";
import bookingModel from "../model/bookingModel.js";
import handlerModel from "../model/handlerModel.js";
import paymentModel from "../model/paymentModel.js";
import petsModel from "../model/petsModel.js";
import stripe from "stripe";
import adminModel from "../model/adminModel.js";
import { createPaymentIntent, hasPaymentMethod } from "../utils/stripeApis.js";
import userWalletModel from "../model/userWalletModel.js";
import refundRequestModel from "../model/refundRequestModel.js";
import pushNotification from "../middleware/pushNotification.js";
import userNotificationModel from "../model/userNotificationModel.js";
import handlerNotificationModel from "../model/handlerNotificationModel.js";
const stripeInstance = stripe(process.env.STRIPE_KEY);

//booking service

export const userBookingService = async (req, res) => {
  try {
    const { user_id } = req.user;
    const {
      handlerId,
      petId,
      bookingStartTime,
      bookingEndTime,
      bookingDate,
      additional,
      pay,
      walletId,
    } = req.body;

    // console.log(req.body);
    const user = await authModel
      .findOne({
        _id: user_id,
        userType: "users",
      })
      .populate("profile");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    //find admin

    const findadmin = await adminModel.findOne().populate("auth");
    if (!findadmin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    // Validate required fields
    const requiredFields = [
      { field: handlerId, message: "handler id not provide" },
      { field: petId, message: "pet id not provide" },
      { field: bookingStartTime, message: "booking Start Time not provide" },
      { field: bookingEndTime, message: "booking End Time not provide" },
      { field: additional, message: "additional not provide" },
      { field: bookingDate, message: "bookingDate not provide" },
    ];

    for (const fieldObj of requiredFields) {
      if (!fieldObj.field) {
        return res.status(400).json({
          success: false,
          message: fieldObj.message,
        });
      }
    }

    const handler = await handlerModel.findById(handlerId).populate("pets");

    const pets = await petsModel.findOne({ _id: petId, profile: handlerId });
    if (!pets) {
      return res.status(400).json({
        success: false,
        message: "pets not found",
      });
    }

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    const currentTime = Date.now();

    const startDate = new Date(bookingDate); // Convert booking date to Date object
    const startTimeString = `${bookingDate}T${bookingStartTime}`;
    const endTimeString = `${bookingDate}T${bookingEndTime}`;
    const startTime = new Date(startTimeString).getTime(); // Convert to milliseconds since Unix epoch
    const endTime = new Date(endTimeString).getTime(); // Convert to milliseconds since Unix epoch

    // Check if either startTime or endTime is in the past relative to currentTime
    if (startTime < currentTime || endTime < currentTime) {
      return res.status(400).json({
        success: false,
        message: "Booking not available on previous date or time",
      });
    }

    let totalPetPrice = 0;

    totalPetPrice += pets.pricePerHours;

    const totalTimeInHours = (endTime - startTime) / (1000 * 60 * 60);

    const Amount = totalTimeInHours * totalPetPrice;

    const Charges = totalPetPrice; // Assuming Charges is the price per hour

    //find booking on already bookings date
    const findPreviousBooking = await bookingModel.findOne({
      bookingDate: startDate.getTime(),
      bookingStartTime: { $lt: endTime },
      bookingEndTime: { $gt: startTime },
      handlerId: handlerId,
      petId: petId,
    });

    if (findPreviousBooking) {
      return res.status(400).json({
        success: false,
        message: "booking not available on that date and time",
      });
    }

    if (walletId) {
      if (!walletId) {
        return res.status(400).json({
          success: false,
          message: "wallet id not provide",
        });
      }

      const findUserWallet = await userWalletModel.findById({ _id: walletId });
      if (!findUserWallet) {
        return res.status(400).json({
          success: false,
          message: "user wallet not found",
        });
      }

      if (findUserWallet.balance < Amount) {
        return res.status(400).json({
          success: false,
          message: "your balance is insufficient",
        });
      }
      const currenttime = Date.now();
      const createbooking = await new bookingModel({
        userId: user.profile._id,
        handlerId: handlerId,
        petId: pets._id,
        selectedDate: currenttime,
        bookingStartTime: startTime,
        bookingEndTime: endTime,
        additional,
        bookingDate: startDate,
        isWallet: true,
      }).save();

      // Get the booking document again using its ID and populate handlerid and its pets array
      const populatedBooking = await bookingModel
        .findById(createbooking._id)
        .populate({
          path: "handlerId",
          populate: {
            path: "pets",
            model: "pets",
          },
        })
        .exec();

      if (!createbooking) {
        return res.status(400).json({
          success: false,
          message: "booking not save",
        });
      }

      const createUserPayment = await new paymentModel({
        userId: user.profile._id,
        handlerId: handlerId,
        bookingId: createbooking._id,
        Charges: Charges,
        totalTime: totalTimeInHours,
        totalAmount: Amount,
        bookingDate: startDate,
        selectedDate: currenttime,
      }).save();

      // Get the payment document again using its ID and populate handlerid and its pets array
      const populatedPayment = await paymentModel
        .findById(createUserPayment._id)
        .populate(["userId", "handlerId", "bookingId"])
        .exec();

      console.log(populatedPayment, "payment"); // Check if the bookingId field is populated

      if (!createUserPayment) {
        return res.status(400).json({
          success: false,
          message: "payment not create",
        });
      }

      // Update user's wallet balance and push payment ID into Debit array
      findUserWallet.balance -= Amount;
      findUserWallet.Debit.push(createUserPayment._id);
      await findUserWallet.save(); // Await save operation

      //send notification to the admin

      const notificationObj = {
        deviceToken: findadmin.auth.deviceToken,
        title: "booking notification",
        body: `${user.profile.userFirstName} booking a service for ${handler.handlerName} from wallet`,
        auth: findadmin.auth,
      };

      const createNotification = new adminNotificationModel(notificationObj);
      const save = createNotification.save();

      try {
        await pushNotification(notificationObj);
      } catch (error) {
        console.log(error.message);
      }

      //notification send to the user

      const notificationObjUser = {
        deviceToken: user.deviceToken,
        title: "booking notification",
        body: `Thank you for booking a service for ${handler.handlerName}. We look forward to serving you!`,
        auth: user_id,
      };

      const createNotificationUser = new userNotificationModel(
        notificationObjUser
      );
      const saveUser = createNotificationUser.save();

      try {
        await pushNotification(notificationObjUser);
      } catch (error) {
        console.log(error.message);
      }

      //notification send to the handler

      const notificationObjHandler = {
        deviceToken: handler.auth,
        title: "booking notification",
        body: `you have new booking from ${user.profile.userFirstName}`,
        auth: handler.auth,
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

      return res.status(200).json({
        success: true,
        message: "Booking and payment processed successfully",
        data: populatedPayment,
      });
    } else if (pay) {
      if (!pay) {
        return res.status(400).json({
          success: false,
          message: "amount not provide",
        });
      }

      // Constants for Stripe fees
      const stripeFeePercentage = 0.029; // 2.9%
      const stripeFeeFixed = 0.3; // $0.30

      // Calculate the total amount after adding Stripe fees
      const totalAmountWithFees =
        Amount + Amount * stripeFeePercentage + stripeFeeFixed;

      // Calculate the total Stripe fees
      const stripeFees = Amount * stripeFeePercentage + stripeFeeFixed;

      const fixedFees = stripeFees.toFixed(2);

      // Message for the customer
      const message = `To pay for your purchase with Stripe fees included, please pay $${totalAmountWithFees.toFixed(
        2
      )}. This includes a Stripe fee of $${stripeFees.toFixed(2)}.`;

      if (pay < totalAmountWithFees) {
        return res.status(400).json({
          success: false,
          message: message,
        });
      }

      // Check if Stripe ID is available

      if (user.profile.customerId === "") {
        return res.status(400).json({
          success: false,
          message: "Customer ID not found",
        });
      } else {
        try {
          const amountInCents = Math.round(pay * 100); // Convert dollars to cents

          const paymentIntent = await stripeInstance.paymentIntents.create({
            amount: amountInCents, // Amount in cents
            currency: "usd",
            payment_method_types: ["card"],
            metadata: {
              userId: user.profile._id.toString(),
              handlerId: handler._id.toString(),
              petId: petId,
              bookingStartTime: bookingStartTime,
              bookingEndTime: bookingEndTime,
              bookingDate: bookingDate,
              additional: additional,
              fixedFees: fixedFees,
              pay: amountInCents,
              totalTimeInHours: totalTimeInHours,
              Charges: Charges,
            }, // Specify the payment methods you accept
          });

          console.log(paymentIntent, "tets");

          const paymentIntentRes = {
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
          };

          //notification send to the user

          const notificationObjUser = {
            deviceToken: user.deviceToken,
            title: "booking notification",
            body: `Thank you for booking a service for ${handler.handlerName}. We look forward to serving you!`,
            auth: user_id,
          };

          const createNotificationUser = new userNotificationModel(
            notificationObjUser
          );
          const saveUser = createNotificationUser.save();

          try {
            await pushNotification(notificationObjUser);
          } catch (error) {
            console.log(error.message);
          }

          //notification send to the handler

          const notificationObjHandler = {
            deviceToken: handler.auth,
            title: "booking notification",
            body: `you have new booking from ${user.profile.userFirstName}`,
            auth: handler.auth,
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

          const currenttime = Date.now();
          const createbooking = await new bookingModel({
            userId: user.profile._id,
            handlerId: handlerId,
            petId: pets._id,
            selectedDate: currenttime,
            bookingStartTime: startTime,
            bookingEndTime: endTime,
            additional,
            bookingDate: startDate,
          }).save();

          // Get the booking document again using its ID and populate handlerid and its pets array
          const populatedBooking = await bookingModel
            .findById(createbooking._id)
            .populate({
              path: "handlerId",
              populate: {
                path: "pets",
                model: "pets",
              },
            })
            .exec();

          if (!createbooking) {
            return res.status(400).json({
              success: false,
              message: "booking not save",
            });
          }

          const expirationTime = Date.now() + 3 * 60 * 1000; // 3 minutes from now

          const createUserPayment = await new paymentModel({
            userId: user.profile._id,
            handlerId: handlerId,
            bookingId: createbooking._id,
            Charges: Charges,
            totalTime: totalTimeInHours,
            totalAmount: Amount,
            deductionFee: fixedFees,
            bookingDate: startDate,
            selectedDate: expirationTime,
            pay: pay,
            paymentIntentId: paymentIntent.id,
          }).save();

          // Get the payment document again using its ID and populate handlerid and its pets array
          const populatedPayment = await paymentModel
            .findById(createUserPayment._id)
            .populate(["userId", "handlerId", "bookingId"])
            .exec();

          // console.log(populatedPayment, 'payment'); // Check if the bookingId field is populated

          if (!createUserPayment) {
            return res.status(400).json({
              success: false,
              message: "payment not create",
            });
          }

          // Function to handle expiration

          const handleExpiration = async () => {
            try {
              const payment = await paymentModel
                .find({ _id: createUserPayment._id, paymentStatus: false })
                .exec();
              if (payment && Date.now() > payment.selectedDate) {
                console.log("Payment expired, handling expiration.");
                // Populate the bookingId field in the payment document
                const paymentWithBooking = await paymentModel
                  .findById(createUserPayment._id)
                  .populate("bookingId")
                  .exec();
                // Check if the associated booking has isWallet: false

                if (
                  paymentWithBooking.bookingId &&
                  !paymentWithBooking.bookingId.isWallet
                ) {
                  await paymentModel
                    .findOneAndDelete({
                      _id: paymentWithBooking._id,
                      isReceived: false,
                      paymentStatus: false,
                    })
                    .exec();
                  // Handle expiration
                  await bookingModel
                    .findOneAndDelete({
                      _id: paymentWithBooking.bookingId._id,
                      isWallet: false,
                    })
                    .exec();

                  // Expire the payment intent with Stripe
                  await stripeInstance.paymentIntents.cancel(paymentIntent.id);
                }
              }
            } catch (error) {
              console.error("Error handling payment expiration:", error);
            }
          };

          setTimeout(handleExpiration, 3 * 60 * 1000); // 3 minutes

          // Return success response if needed
          return res.status(200).json({
            success: true,
            message: "Booking processed successfully",
            data: { paymentIntentRes, populatedPayment },
          });
        } catch (error) {
          console.error("Error during payment process:", error.message);
          return res.status(500).json({
            success: false,
            message: "Error during payment process",
            error: error.message,
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "payment method not defined",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//new booking

export const userNewBooking = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await authModel
      .findOne({
        _id: user_id,
        userType: "users",
      })
      .populate("profile");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const userId = user.profile._id;

    const getnewbooking = await paymentModel
      .find({
        userId: userId,
        isReceived: false,
        paymentStatus: true,
      })
      .populate([
        "bookingId",
        { path: "bookingId", populate: "petId" },
        { path: "userId", populate: "auth" },
        { path: "handlerId", populate: "pets" },
      ]);

    if (getnewbooking.length === 0) {
      return res.status(400).json({
        success: false,
        message: "new booking not found",
      });
    }

    console.log(getnewbooking, "test");
    const updatedata = getnewbooking.map((item) => {
      const userId = item.userId;
      const handler = item.handlerId;
      const booking = item.bookingId;
      const pet = item.bookingId.petId;

      // Convert milliseconds to Date objects
      const bookingDate = new Date(booking.bookingDate);
      const selectedDate = new Date(booking.selectedDate);
      const bookingStartTime = new Date(booking.bookingStartTime);
      const bookingEndTime = new Date(booking.bookingEndTime);

      return {
        _id: item._id,
        handlerName: handler.handlerName,
        phoneNumber: userId.auth.userNumber,
        bookingId: booking._id,
        bookingDate: bookingDate.toLocaleString(), // Adjust format as per your requirement
        selectedDate: selectedDate.toLocaleString(),
        bookingStartTime: bookingStartTime.toLocaleTimeString(),
        bookingEndTime: bookingEndTime.toLocaleTimeString(),
        additional: booking.additional,
        petName: pet.petName,
        petsImages: pet.petsImages,
        Charges: item.Charges,
        totalTime: item.totalTime,
        TotalAmount: item.totalAmount,
        Tax: item.deductionFee,
        Subtotal: item.pay,
      };
    });

    return res.status(200).json({
      success: true,
      message: "new booking found successfully",
      data: updatedata,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//booking history

export const userBookingHistory = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await authModel
      .findOne({
        _id: user_id,
        userType: "users",
      })
      .populate("profile");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const userId = user.profile._id;

    //check if booking is complete or not

    const getbookinghistory = await paymentModel
      .find({ userId: userId, isReceived: true, paymentStatus: true })
      .populate([
        "bookingId",

        { path: "userId", populate: "auth" },

        { path: "handlerId", populate: "pets" },
        { path: "bookingId", populate: "petId" },
      ]);

    if (!getbookinghistory || getbookinghistory.length === 0) {
      return res.status(400).json({
        success: false,
        message: "booking history not found",
      });
    }

    const updatedata = getbookinghistory.map((item) => {
      const userId = item.userId;
      const handler = item.handlerId;
      const booking = item.bookingId;
      const pet = item.bookingId.petId;
      console.log(handler);

      // Convert milliseconds to Date objects
      const bookingDate = new Date(booking.bookingDate);
      const selectedDate = new Date(booking.selectedDate);
      const bookingStartTime = new Date(booking.bookingStartTime);
      const bookingEndTime = new Date(booking.bookingEndTime);

      return {
        _id: item._id,
        handlerName: handler.handlerName,
        handlerProfilePhoto: handler.handlerProfilePhoto,
        petName: handler.pets[0].petName,
        phoneNumber: userId.auth.userNumber,
        bookingId: booking._id,
        bookingDate: bookingDate.toLocaleString(), // Adjust format as per your requirement
        selectedDate: selectedDate.toLocaleString(),
        bookingStartTime: bookingStartTime.toLocaleTimeString(),
        bookingEndTime: bookingEndTime.toLocaleTimeString(),
        additional: booking.additional,
        petName: pet.petName,
        petsImages: pet.petsImages,
        Charges: item.Charges,
        totalTime: item.totalTime,
        TotalAmount: item.totalAmount,
        Tax: item.deductionFee,
        Subtotal: item.pay,
      };
    });

    return res.status(200).json({
      success: true,
      message: "booking history found successfully",
      data: updatedata,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//reschedule booking

export const reScheduleBooking = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { bookingDate, bookingStartTime, bookingEndTime, additional } =
      req.body;
    const { bookingId } = req.params;

    const user = await authModel
      .findOne({
        _id: user_id,
        userType: "users",
      })
      .populate("profile");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    // Validate required fields
    const requiredFields = [
      { field: bookingDate, message: "bookingDate not provide" },
      { field: bookingStartTime, message: "bookingStartTime not provide" },
      { field: bookingEndTime, message: "bookingEndTime not provide" },
      { field: additional, message: "additional not provide" },
    ];

    for (const fieldObj of requiredFields) {
      if (!fieldObj.field) {
        return res.status(400).json({
          success: false,
          message: fieldObj.message,
        });
      }
    }

    const booking = await bookingModel
      .findOne({ _id: bookingId, isCompleted: false })
      .populate({
        path: "handlerId",
        populate: { path: "auth" },
      });

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: "booking is not found",
      });
    }

    // Calculate the original duration
    const originalDuration = booking.bookingEndTime - booking.bookingStartTime;

    // Convert original duration to minutes
    const originalDurationInMinutes = originalDuration / (1000 * 60);

    console.log(originalDurationInMinutes, "originalDurationInMinutes");

    const startDate = new Date(bookingDate); // Convert booking date to Date object
    const startTimeString = `${bookingDate}T${bookingStartTime}`;
    const endTimeString = `${bookingDate}T${bookingEndTime}`;
    const startTime = new Date(startTimeString).getTime(); // Convert to milliseconds since Unix epoch
    const endTime = new Date(endTimeString).getTime(); // Convert to milliseconds since Unix epoch

    // Calculate the new duration
    const newDuration = endTime - startTime;

    // Check if the duration has not changed
    const durationNotEqual = originalDuration !== newDuration;

    if (durationNotEqual) {
      return res.status(400).json({
        success: false,
        message: "duration not same with equal to your previous duration",
      });
    }

    // Check if the duration has  changed

    const durationSame = originalDuration === newDuration;

    if (durationSame) {
      // Update the booking with the new end time

      const reSchedule = await bookingModel
        .findByIdAndUpdate(
          bookingId,
          {
            bookingDate: startDate,
            bookingStartTime: startTime,
            bookingEndTime: endTime,
            additional,
          },
          { new: true }
        )
        .populate("handlerId");

      if (!reSchedule) {
        return res.status(400).json({
          success: false,
          message: "Booking not rescheduled",
        });
      }

      //notification send to the user

      const notificationObjUser = {
        deviceToken: user.deviceToken,
        title: "reshedule booking notification",
        body: `you have reshedule booking a service for ${booking.handlerId.handlerName}`,
        auth: user_id,
      };

      const createNotificationUser = new userNotificationModel(
        notificationObjUser
      );
      const saveUser = createNotificationUser.save();

      try {
        await pushNotification(notificationObjUser);
      } catch (error) {
        console.log(error.message);
      }

      //notification send to the handler

      const notificationObjHandler = {
        deviceToken: booking.handlerId.auth.deviceToken,
        title: "reshedule booking notification",
        body: `your booking is reschedule from ${user.profile.userFirstName}`,
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

      return res.status(200).json({
        success: false,
        message: "Booking rescheduled successfully",
        data: reSchedule,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//reschedule appointment

export const reScheduleAppointment = async (req, res) => {
  try {
    const { user_id } = req.user;
    const {
      bookingStartTime,
      bookingEndTime,
      bookingDate,
      additional,
      pay,
      walletId,
    } = req.body;
    const { bookingId } = req.params;

    const user = await authModel
      .findOne({
        _id: user_id,
        userType: "users",
      })
      .populate("profile");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    //find admin

    const findadmin = await adminModel.findOne().populate("auth");
    if (!findadmin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const findBooking = await paymentModel
      .findOne({ bookingId: bookingId, isReceived: true })
      .populate("bookingId");

    if (!findBooking) {
      return res.status(400).json({
        success: false,
        message: "booking not found",
      });
    }

    const handler = await handlerModel
      .findById(findBooking.handlerId)
      .populate("pets");

    const pets = await petsModel.findOne({
      _id: findBooking.bookingId.petId,
      profile: findBooking.handlerId,
    });
    if (!pets) {
      return res.status(400).json({
        success: false,
        message: "pets not found",
      });
    }

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    // Validate required fields
    const requiredFields = [
      { field: bookingStartTime, message: "bookingStartTime not provide" },
      { field: bookingEndTime, message: "bookingEndTime not provide" },
      { field: additional, message: "additional not provide" },
      { field: bookingDate, message: "bookingDate not provide" },
    ];

    for (const fieldObj of requiredFields) {
      if (!fieldObj.field) {
        return res.status(400).json({
          success: false,
          message: fieldObj.message,
        });
      }
    }
    const startDate = new Date(bookingDate); // Convert booking date to Date object
    const startTimeString = `${bookingDate}T${bookingStartTime}`;
    const endTimeString = `${bookingDate}T${bookingEndTime}`;
    const startTime = new Date(startTimeString).getTime(); // Convert to milliseconds since Unix epoch
    const endTime = new Date(endTimeString).getTime(); // Convert to milliseconds since Unix epoch

    const currentTime = Date.now();

    // Check if either startTime or endTime is in the past relative to currentTime
    if (startTime < currentTime || endTime < currentTime) {
      return res.status(400).json({
        success: false,
        message: "Booking not available on previous date or time",
      });
    }

    let totalPetPrice = 0;

    totalPetPrice += pets.pricePerHours;

    const totalTimeInHours = (endTime - startTime) / (1000 * 60 * 60);

    const Amount = totalTimeInHours * totalPetPrice;

    const Charges = totalPetPrice; // Assuming Charges is the price per hour

    //find booking on previous date
    const findPreviousBooking = await bookingModel.findOne({
      bookingDate: startDate,
      bookingStartTime: { $lt: endTime }, // Existing booking's end time is after new booking's start time
      bookingEndTime: { $gt: startTime }, // Existing booking's start time is before new booking's end time
    });

    if (findPreviousBooking) {
      return res.status(400).json({
        success: false,
        message: "booking not available on that date and time",
      });
    }

    if (walletId) {
      if (!walletId) {
        return res.status(400).json({
          success: false,
          message: "wallet id not provide",
        });
      }

      const findUserWallet = await userWalletModel.findById({ _id: walletId });
      if (!findUserWallet) {
        return res.status(400).json({
          success: false,
          message: "user wallet not found",
        });
      }

      if (findUserWallet.balance < Amount) {
        return res.status(400).json({
          success: false,
          message: "your balance is insufficient",
        });
      }
      const currenttime = Date.now();
      const createbooking = await new bookingModel({
        userId: user.profile._id,
        handlerId: findBooking.handlerId,
        petId: pets._id,
        selectedDate: currenttime,
        bookingStartTime: startTime,
        bookingEndTime: endTime,
        additional,
        bookingDate: startDate,
        isWallet: true,
      }).save();

      // Get the booking document again using its ID and populate handlerid and its pets array
      const populatedBooking = await bookingModel
        .findById(createbooking._id)
        .populate({
          path: "handlerId",
          populate: {
            path: "pets",
            model: "pets",
          },
        })
        .exec();

      if (!createbooking) {
        return res.status(400).json({
          success: false,
          message: "booking not save",
        });
      }

      const createUserPayment = await new paymentModel({
        userId: user.profile._id,
        handlerId: findBooking.handlerId,
        bookingId: createbooking._id,
        Charges: Charges,
        totalTime: totalTimeInHours,
        totalAmount: Amount,
        bookingDate: startDate,
        selectedDate: currenttime,
      }).save();

      // Get the payment document again using its ID and populate handlerid and its pets array
      const populatedPayment = await paymentModel
        .findById(createUserPayment._id)
        .populate(["userId", "handlerId", "bookingId"])
        .exec();

      console.log(populatedPayment, "payment"); // Check if the bookingId field is populated

      if (!createUserPayment) {
        return res.status(400).json({
          success: false,
          message: "payment not create",
        });
      }

      // Update user's wallet balance and push payment ID into Debit array
      findUserWallet.balance -= Amount;
      findUserWallet.Debit.push(createUserPayment._id);
      await findUserWallet.save(); // Await save operation

      //send notification to the admin

      const notificationObj = {
        deviceToken: findadmin.auth.deviceToken,
        title: "booking notification",
        body: `${user.profile.userFirstName} booking a service for ${handler.handlerName} from wallet`,
        auth: findadmin.auth,
      };

      const createNotification = new adminNotificationModel(notificationObj);
      const save = createNotification.save();

      try {
        await pushNotification(notificationObj);
      } catch (error) {
        console.log(error.message);
      }

      //notification send to the user

      const notificationObjUser = {
        deviceToken: user.deviceToken,
        title: "booking notification",
        body: `Thank you for booking a service for ${handler.handlerName}. We look forward to serving you!`,
        auth: user_id,
      };

      const createNotificationUser = new userNotificationModel(
        notificationObjUser
      );
      const saveUser = createNotificationUser.save();

      try {
        await pushNotification(notificationObjUser);
      } catch (error) {
        console.log(error.message);
      }

      //notification send to the handler

      const notificationObjHandler = {
        deviceToken: handler.auth,
        title: "booking notification",
        body: `you have new booking from ${user.profile.userFirstName}`,
        auth: handler.auth,
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

      return res.status(200).json({
        success: true,
        message: "Booking and payment processed successfully",
        data: populatedPayment,
      });
    } else if (pay) {
      if (!pay) {
        return res.status(400).json({
          success: false,
          message: "amount not provide",
        });
      }

      // Constants for Stripe fees
      const stripeFeePercentage = 0.029; // 2.9%
      const stripeFeeFixed = 0.3; // $0.30

      // Calculate the total amount after adding Stripe fees
      const totalAmountWithFees =
        Amount + Amount * stripeFeePercentage + stripeFeeFixed;

      // Calculate the total Stripe fees
      const stripeFees = Amount * stripeFeePercentage + stripeFeeFixed;

      const fixedFees = stripeFees.toFixed(2);

      // Message for the customer
      const message = `To pay for your purchase with Stripe fees included, please pay $${totalAmountWithFees.toFixed(
        2
      )}. This includes a Stripe fee of $${stripeFees.toFixed(2)}.`;

      if (pay < totalAmountWithFees) {
        return res.status(400).json({
          success: false,
          message: message,
        });
      }

      // Check if Stripe ID is available

      if (user.profile.customerId === "") {
        return res.status(400).json({
          success: false,
          message: "Customer ID not found",
        });
      } else {
        try {
          const amountInCents = Math.round(pay * 100); // Convert dollars to cents

          const paymentIntent = await stripeInstance.paymentIntents.create({
            amount: amountInCents, // Amount in cents
            currency: "usd",
            payment_method_types: ["card"], // Specify the payment methods you accept
          });

          const paymentIntentRes = {
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
          };

          //notification send to the user

          const notificationObjUser = {
            deviceToken: user.deviceToken,
            title: "booking notification",
            body: `Thank you for booking a service for ${handler.handlerName}. We look forward to serving you!`,
            auth: user_id,
          };

          const createNotificationUser = new userNotificationModel(
            notificationObjUser
          );
          const saveUser = createNotificationUser.save();

          try {
            await pushNotification(notificationObjUser);
          } catch (error) {
            console.log(error.message);
          }

          //notification send to the handler

          const notificationObjHandler = {
            deviceToken: handler.auth,
            title: "booking notification",
            body: `you have new booking from ${user.profile.userFirstName}`,
            auth: handler.auth,
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

          const currenttime = Date.now();
          const createbooking = await new bookingModel({
            userId: user.profile._id,
            handlerId: findBooking.handlerId,
            petId: pets._id,
            selectedDate: currenttime,
            bookingStartTime: startTime,
            bookingEndTime: endTime,
            additional,
            bookingDate: startDate,
          }).save();

          // Get the booking document again using its ID and populate handlerid and its pets array
          const populatedBooking = await bookingModel
            .findById(createbooking._id)
            .populate({
              path: "handlerId",
              populate: {
                path: "pets",
                model: "pets",
              },
            })
            .exec();

          // console.log(populatedBooking);

          if (!createbooking) {
            return res.status(400).json({
              success: false,
              message: "booking not save",
            });
          }

          const createUserPayment = await new paymentModel({
            userId: user.profile._id,
            handlerId: findBooking.handlerId,
            bookingId: createbooking._id,
            Charges: Charges,
            totalTime: totalTimeInHours,
            totalAmount: Amount,
            deductionFee: fixedFees,
            bookingDate: startDate,
            selectedDate: currenttime,
            pay: pay,
            paymentIntentId: paymentIntent.id,
            // subTotal:
          }).save();

          // Get the payment document again using its ID and populate handlerid and its pets array
          const populatedPayment = await paymentModel
            .findById(createUserPayment._id)
            .populate(["userId", "handlerId", "bookingId"])
            .exec();

          if (!createUserPayment) {
            return res.status(400).json({
              success: false,
              message: "payment not create",
            });
          }

          // Return success response if needed
          return res.status(200).json({
            success: true,
            message: "Booking and payment processed successfully",
            data: { paymentIntentRes, populatedPayment },
          });
        } catch (error) {
          console.error("Error during payment process:", error.message);
          return res.status(500).json({
            success: false,
            message: "Error during payment process",
            error: error.message,
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "payment method not defined",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//refund booking

export const refundBooking = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { bookingId } = req.params;
    const { refundReason, description } = req.body;
    const user = await authModel
      .findOne({
        _id: user_id,
        userType: "users",
      })
      .populate("profile");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const booking = await paymentModel.findOne({
      bookingId: bookingId,
      userId: user.profile._id,
      isReceived: false,
    });

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: "booking not found",
      });
    }

    const findadmin = await adminModel.findOne();
    if (!findadmin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const create = new refundRequestModel({
      refundReason,
      description,
      authId: user_id,
      paymentId: booking._id,
    });

    const saveRefund = await create.save();

    if (!saveRefund) {
      return res.status(400).json({
        success: false,
        message: "error in creating refund model",
      });
    }

    const notificationObj = {
      deviceToken: findadmin.auth.deviceToken,
      title: "Refund Amount",
      body: `refund request from ${user.profile.userFirstName}`,
      auth: findadmin.auth,
    };

    const createNotification = new adminNotificationModel(notificationObj);
    const save = createNotification.save();

    try {
      await pushNotification(notificationObj);
    } catch (error) {
      console.log(error.message);
    }

    return res.status(200).json({
      success: true,
      message: "payment refund request send successfully",
      data: saveRefund,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//user balance

export const userBalance = async (req, res) => {
  try {
    const { user_id } = req.user;

    const user = await authModel.findOne({
      _id: user_id,
      userType: "users",
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    try {
      const findUserWallet = await userWalletModel.find({ authid: user_id });

      if (!findUserWallet) {
        return res.status(400).json({
          success: false,
          message: "user wallet not found",
        });
      }
      console.log(findUserWallet[0].balance);

      const userBalance = findUserWallet[0].balance;

      return res.status(200).json({
        success: true,
        message: "user balance found successfully",
        data: userBalance,
      });
    } catch (error) {
      console.error("Error retrieving refund balance:", error);
      throw error;
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//debit service

export const userDebitServices = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await authModel
      .findOne({
        _id: user_id,
        userType: "users",
      })
      .populate("profile");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const getDebitServices = await userWalletModel
      .find({ authid: user_id })
      .populate({
        path: "Debit",
        populate: [
          { path: "handlerId", populate: "pets" },
          { path: "bookingId" },
        ],
      });
    if (getDebitServices[0].Debit.length === 0) {
      return res.status(400).json({
        success: false,
        message: "debit id not exist",
      });
    }
    if (!getDebitServices || getDebitServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "debit not found",
      });
    }

    const updatedata = getDebitServices
      .map((item) => {
        return item.Debit.map((debitItem) => {
          const handler = debitItem.handlerId;
          const booking = debitItem.bookingId;
          return {
            _id: item._id,
            handlerName: handler.handlerName,
            petName: handler.pets[0].petName,
            petsImages: handler.pets[0].petsImages[0],
            bookingDate: booking.bookingDate,
            bookingStartTime: booking.bookingStartTime,
            bookingEndTime: booking.bookingEndTime,
            totalAmount: debitItem.totalAmount,
          };
        });
      })
      .flat(); //use flat for arrays of array into single array

    return res.status(200).json({
      success: false,
      message: "user debit found successfully",
      data: updatedata,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//refund service

export const userRefundServices = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await authModel
      .findOne({
        _id: user_id,
        userType: "users",
      })
      .populate("profile");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const getRefundServices = await userWalletModel
      .find({ authid: user_id })
      .populate({
        path: "Refunds",
        populate: [
          { path: "handlerId", populate: "pets" },
          { path: "bookingId" },
        ],
      });

    if (getRefundServices[0].Refunds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "refund id not exist",
      });
    }
    if (!getRefundServices.length || getRefundServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "refund not found",
      });
    }

    const updatedata = getRefundServices
      .map((item) => {
        return item.Refunds.map((RefundItem) => {
          const handler = RefundItem.handlerId;
          const booking = RefundItem.bookingId;
          return {
            _id: item._id,
            handlerName: handler.handlerName,
            petName: handler.pets[0].petName,
            petsImages: handler.pets[0].petsImages[0],
            bookingDate: booking.bookingDate,
            bookingStartTime: booking.bookingStartTime,
            bookingEndTime: booking.bookingEndTime,
            totalAmount: RefundItem.totalAmount,
          };
        });
      })
      .flat();

    return res.status(200).json({
      success: true,
      message: "user refund found successfully",
      data: updatedata,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.body;
    const deleted = await stripeInstance.accounts.del(id);
    console.log(deleted);
    return res.status(200).json({
      success: true,
      message: "id delete successfully",
    });
  } catch (error) {
    console.log(error.message);
  }
};

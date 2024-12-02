import authModel from "../model/authModel.js";
import bookingModel from "../model/bookingModel.js";
import paymentModel from "../model/paymentModel.js";
import moment from "moment";
import stripe from "stripe";
import {
  createPayout,
  getAllBankDetail,
  getBalance,
} from "../utils/stripeApis.js";
import handlerNotificationModel from "../model/handlerNotificationModel.js";
import pushNotification from "../middleware/pushNotification.js";

const stripeInstance = stripe(process.env.STRIPE_KEY);

//new booking

export const handlerNewBooking = async (req, res) => {
  try {
    const { user_id } = req.user;
    const handler = await authModel
      .findOne({
        _id: user_id,
        userType: "handlers",
      })
      .populate("profile");

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    const getNewBooking = await paymentModel
      .find({ handlerId: handler.profile._id, isReceived: false })

      .populate([
        "userId",

        { path: "userId", populate: "auth" },
        { path: "bookingId", populate: "petId" },
      ]);

    if (getNewBooking.length === 0) {
      return res.status(400).json({
        success: false,
        message: "new booking not found",
      });
    }

    console.log(getNewBooking, "test");
    const updateData = getNewBooking.map((item) => {
      const authId = item.userId.auth;
      const userId = item.userId;
      const bookingId = item.bookingId;
      const petId = item.bookingId.petId;

      // Convert milliseconds to Date objects
      const bookingDate = new Date(bookingId.bookingDate);
      const selectedDate = new Date(bookingId.selectedDate);
      const bookingStartTime = new Date(bookingId.bookingStartTime);
      const bookingEndTime = new Date(bookingId.bookingEndTime);

      return {
        _id: item._id,
        authId: authId._id,
        userDateOfBirth: userId.userDateOfBirth,
        userEmail: authId.userEmail,
        userNumber: authId.userNumber,
        userFirstName: userId.userFirstName,
        userLastName: userId.userLastName,
        userCity: userId.userCity,
        Email: authId.Email,
        userProfileImage: userId.userProfileImage,
        userGender: userId.userGender,
        userAddress: userId.userAddress,
        userCity: userId.userCity,
        userState: userId.userState,
        Number: authId.Number,
        petName: petId.petName,
        userLocation: userId.userLocation,
        bookingId: bookingId._id,
        bookingDate: bookingDate.toLocaleString(), // Adjust format as per your requirement
        selectedDate: selectedDate.toLocaleString(),
        bookingStartTime: bookingStartTime.toLocaleTimeString(),
        bookingEndTime: bookingEndTime.toLocaleTimeString(),
        additional: bookingId.additional,
        isCompleted: bookingId.isCompleted,
        Charges: item.Charges,
        totalTime: item.totalTime,
        totalAmount: item.totalAmount,
        Tax: item.deductionFee,
        pay: item.pay,
      };
    });
    return res.status(200).json({
      success: true,
      message: "new booking found successfully",
      data: updateData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//booking history

export const HandlerBookingHistory = async (req, res) => {
  try {
    const { user_id } = req.user;
    const handler = await authModel
      .findOne({
        _id: user_id,
        userType: "handlers",
      })
      .populate("profile");

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    const getBookingHistory = await paymentModel
      .find({ handlerId: handler.profile._id, isReceived: true })
      .populate([
        "userId",
        "handlerId",

        { path: "userId", populate: "auth" },
        {
          path: "bookingId",
          populate: { path: "petId", populate: "petRatingReview" },
        },
      ]);

    if (getBookingHistory.length === 0) {
      return res.status(400).json({
        success: false,
        message: "booking history not found",
      });
    }

    const updateData = getBookingHistory.map((item) => {
      const authId = item.userId.auth;
      const userId = item.userId;
      const handlerId = item.handlerId;
      const bookingId = item.bookingId;
      const petId = item.bookingId.petId;

      // Convert milliseconds to Date objects
      const bookingDate = new Date(bookingId.bookingDate);
      const selectedDate = new Date(bookingId.selectedDate);
      const bookingStartTime = new Date(bookingId.bookingStartTime);
      const bookingEndTime = new Date(bookingId.bookingEndTime);

      return {
        _id: item._id,
        userDateOfBirth: userId.userDateOfBirth,
        userEmail: authId.userEmail,
        userNumber: authId.userNumber,
        userFirstName: userId.userFirstName,
        userLastName: userId.userLastName,
        userCity: userId.userCity,
        Email: authId.Email,
        userProfileImage: userId.userProfileImage,
        userGender: userId.userGender,
        userAddress: userId.userAddress,
        userCity: userId.userCity,
        userState: userId.userState,
        Number: authId.Number,
        petId: petId._id,
        petName: petId.petName,
        userLocation: userId.userLocation,
        handlerProfilePhoto: handlerId.handlerProfilePhoto,
        bookingDate: bookingDate.toLocaleString(), // Adjust format as per your requirement
        selectedDate: selectedDate.toLocaleString(),
        bookingStartTime: bookingStartTime.toLocaleTimeString(),
        bookingEndTime: bookingEndTime.toLocaleTimeString(),
        additional: bookingId.additional,
        Charges: item.Charges,
        totalTime: item.totalTime,
        totalAmount: item.totalAmount,
        Tax: item.deductionFee,
        pay: item.pay,
      };
    });

    return res.status(200).json({
      success: true,
      message: "booking history found successfully",
      data: getBookingHistory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//complete booking

export const completeBooking = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { bookingId } = req.params;
    const handler = await authModel
      .findOne({
        _id: user_id,
        userType: "handlers",
      })
      .populate("profile");

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }
    //check booking is completed or not

    const checkBooking = await bookingModel.findOne({
      _id: bookingId,
      isCompleted: true,
    });
    if (checkBooking) {
      return res.status(400).json({
        success: false,
        message: "booking already completed",
      });
    }

    //find booking

    const findBooking = await paymentModel
      .findOne({ bookingId: bookingId, isReceived: false })
      .populate("bookingId");

    if (!findBooking) {
      return res.status(400).json({
        success: false,
        message: "booking not found",
      });
    }

    findBooking.completedAt = new Date();
    await findBooking.save();
    const bookingDoc = findBooking.bookingId;
    bookingDoc.isCompleted = true;

    await bookingDoc.save();

    return res.status(200).json({
      success: true,
      message: "booking complete successfully",
      data: findBooking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get today and weekly booking

export const getTodayAndWeeklyBooking = async (req, res) => {
  try {
    const { user_id } = req.user;
    const handler = await authModel
      .findOne({
        _id: user_id,
        userType: "handlers",
      })
      .populate("profile");

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    const todayDate = moment().startOf("day").valueOf(); // Get today's date in milliseconds

    const sample = await paymentModel.find({ handlerId: handler.profile._id });

    const startOfWeek = moment().startOf("week").valueOf(); // Start of the week in milliseconds

    const endOfWeek = moment().endOf("week").valueOf(); // End of the week in milliseconds

    const gettodaybooking = await paymentModel
      .find({
        handlerId: handler.profile._id,
        bookingDate: { $gte: todayDate, $lt: todayDate + 24 * 60 * 60 * 1000 }, // Check if selectedDate is within today
      })
      .populate([
        "userId",
        { path: "userId", populate: "auth" },
        { path: "bookingId", populate: "petId" },
      ]);

    const getweekbooking = await paymentModel
      .find({
        handlerId: handler.profile._id,
        bookingDate: { $gte: startOfWeek, $lt: endOfWeek },
      })
      .populate([
        "userId",
        { path: "userId", populate: "auth" },
        { path: "bookingId", populate: "petId" },
      ]);

    const updatetodayData = gettodaybooking.map((item) => {
      const authId = item.userId.auth;
      const userId = item.userId;
      const bookingId = item.bookingId;
      const petId = item.bookingId.petId;
      return {
        _id: item._id,
        userDateOfBirth: userId.userDateOfBirth,
        userEmail: authId.userEmail,
        userNumber: authId.userNumber,
        userFirstName: userId.userFirstName,
        userLastName: userId.userLastName,
        userCity: userId.userCity,
        Email: authId.Email,
        userProfileImage: userId.userProfileImage,
        userGender: userId.userGender,
        userAddress: userId.userAddress,
        userCity: userId.userCity,
        userState: userId.userState,
        Number: authId.Number,
        petName: petId.petName,
        userLocation: userId.userLocation,
        selectedDate: item.selectedDate,
        bookingStartTime: bookingId.bookingStartTime,
        bookingEndTime: bookingId.bookingEndTime,
        bookingDate: bookingId.bookingDate,
        additional: bookingId.additional,
        Charges: item.Charges,
        totalTime: item.totalTime,
        totalAmount: item.totalAmount,
        Tax: item.deductionFee,
        pay: item.pay,
      };
    });

    const updateweekData = getweekbooking.map((item) => {
      const authId = item.userId.auth;
      const userId = item.userId;
      const bookingId = item.bookingId;
      const petId = item.bookingId.petId;
      return {
        _id: item._id,
        authId: authId._id,
        userDateOfBirth: userId.userDateOfBirth,
        userEmail: authId.userEmail,
        userNumber: authId.userNumber,
        userFirstName: userId.userFirstName,
        userLastName: userId.userLastName,
        userCity: userId.userCity,
        Email: authId.Email,
        userProfileImage: userId.userProfileImage,
        userGender: userId.userGender,
        userAddress: userId.userAddress,
        userCity: userId.userCity,
        userState: userId.userState,
        Number: authId.Number,
        petName: petId.petName,
        userLocation: userId.userLocation,
        selectedDate: item.selectedDate,
        bookingStartTime: bookingId.bookingStartTime,
        bookingEndTime: bookingId.bookingEndTime,
        bookingDate: bookingId.bookingDate,
        additional: bookingId.additional,
        Charges: item.Charges,
        totalTime: item.totalTime,
        totalAmount: item.totalAmount,
        Tax: item.deductionFee,
        pay: item.pay,
      };
    });

    if (updatetodayData.length === 0 && updateweekData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "today and weekly booking not found",
      });
    }
    if (updatetodayData.length === 0) {
      return res.status(200).json({
        success: false,
        message: "today booking not found",
        weeklybooking: updateweekData,
      });
    }

    if (updateweekData.length === 0) {
      return res.status(200).json({
        success: false,
        message: "weekly booking not found",
        todaybooking: updatetodayData,
      });
    }

    return res.status(200).json({
      success: false,
      message: "booking found successfully",
      todaybooking: updatetodayData,
      weeklybooking: updateweekData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get analytics data by week month year

export const getAnalyticsByWeeklyMonthlyYearly = async (req, res) => {
  try {
    const { user_id } = req.user;
    const handler = await authModel
      .findOne({
        _id: user_id,
        userType: "handlers",
      })
      .populate("profile");

    const handlerId = handler.profile._id;

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "Handler not found",
      });
    }

    // Define shootingStatsByTimeframe here as an object
    const paymentStatsByTimeframe = {
      week: [], // Initialize week as an array
      month: [], // Initialize month as an array
      year: [], // Initialize year as an array
    };

    async function calculatePaymentStats(handlerId, startDate, endDate) {
      const getpaymentbookingdetail = await paymentModel.find({
        handlerId: handlerId,
        bookingDate: {
          $gte: startDate,
          $lte: endDate,
        },
        isReceived: true,
      });

      const totalStats = {
        totalEarning: 0,
      };

      if (getpaymentbookingdetail && getpaymentbookingdetail.length > 0) {
        for (const game of getpaymentbookingdetail) {
          totalStats.totalEarning += game.amountAfterAdminDeduction;
        }
      }

      return totalStats;
    }

    const currentDate = moment();

    // Calculate shootingStats for the week
    const weekStartDate = currentDate.clone().startOf("isoWeek");
    const weekEndDate = currentDate.clone().endOf("isoWeek");
    const weekPromises = [];
    for (let i = 0; i < 7; i++) {
      const startDate = weekStartDate.clone().add(i, "days");
      const endDate = weekStartDate.clone().add(i, "days").endOf("day");
      weekPromises.push(calculatePaymentStats(handlerId, startDate, endDate));
    }

    // Calculate shootingStats for the month
    const monthStartDate = currentDate.clone().startOf("month");
    const monthEndDate = currentDate.clone().endOf("month");
    const monthPromises = [];
    for (let i = 0; i < 30; i++) {
      const startDate = monthStartDate.clone().add(i, "days");
      const endDate = monthStartDate.clone().add(i, "days").endOf("day");
      monthPromises.push(calculatePaymentStats(handlerId, startDate, endDate));
    }

    // Calculate shootingStats for the year
    const yearStartDate = currentDate.clone().startOf("year");
    const yearEndDate = currentDate.clone().endOf("year");
    const yearPromises = [];
    for (let i = 0; i < 365; i++) {
      const startDate = yearStartDate.clone().add(i, "days");
      const endDate = yearStartDate.clone().add(i, "days").endOf("day");
      yearPromises.push(calculatePaymentStats(handlerId, startDate, endDate));
    }

    // Wait for all promises to resolve
    const shootingStatsForWeek = await Promise.all(weekPromises);
    const shootingStatsForMonth = await Promise.all(monthPromises);
    const shootingStatsForYear = await Promise.all(yearPromises);

    // Populate shootingStatsByTimeframe

    paymentStatsByTimeframe.week = shootingStatsForWeek.map((stats, index) => ({
      date: weekStartDate.clone().add(index, "days").format("YYYY-MM-DD"),
      day: weekStartDate.clone().add(index, "days").format("dddd"),
      ...stats,
    }));
    paymentStatsByTimeframe.month = shootingStatsForMonth.map(
      (stats, index) => ({
        date: monthStartDate.clone().add(index, "days").format("YYYY-MM-DD"),
        day: monthStartDate.clone().add(index, "days").format("dddd"),
        ...stats,
      })
    );
    paymentStatsByTimeframe.year = shootingStatsForYear.map((stats, index) => ({
      date: yearStartDate.clone().add(index, "days").format("YYYY-MM-DD"),
      day: yearStartDate.clone().add(index, "days").format("dddd"),
      ...stats,
    }));

    //
    const totalBooking = await paymentModel.countDocuments({
      handlerId: handler.profile._id,
    });

    if (!totalBooking || totalBooking.length === 0) {
      return res.status(400).json({
        success: false,
        message: "total booking not found",
      });
    }

    //

    let totalEarning = 0;

    const getpayment = await paymentModel
      .find({
        handlerId: handler.profile._id,
        isReceived: true,
      })
      .populate("handlerId");

    //calculate total earning

    getpayment.forEach((item) => {
      totalEarning += item.amountAfterAdminDeduction;
    });

    // Calculate total earnings for the last 30 days

    const thirtyDaysAgo = moment().subtract(30, "days");

    const last30Days = getpayment.filter((item) =>
      moment(item.bookingDate).isAfter(thirtyDaysAgo)
    );

    let last30DaysEarning = 0;

    last30Days.forEach((item) => {
      last30DaysEarning += item.amountAfterAdminDeduction;
    });

    return res.status(200).json({
      success: true,
      message: "Payment and booking detail found",
      data: {
        paymentStatsByTimeframe,
        totalBooking,
        totalEarning,
        last30DaysEarning,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//my earning

export const myEarning = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { date } = req.query;
    const handler = await authModel
      .findOne({
        _id: user_id,
        userType: "handlers",
      })
      .populate("profile");
    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    let totalEarning = 0;

    const getpayment = await paymentModel
      .find({
        handlerId: handler.profile._id,
        isReceived: true,
      })
      .populate("handlerId");

    //calculate total earning

    getpayment.forEach((item) => {
      totalEarning += item.amountAfterAdminDeduction;
    });

    // Calculate total earnings for the last 30 days

    const thirtyDaysAgo = moment().subtract(30, "days");

    const last30Days = getpayment.filter((item) =>
      moment(item.bookingDate).isAfter(thirtyDaysAgo)
    );

    let last30DaysEarning = 0;

    last30Days.forEach((item) => {
      last30DaysEarning += item.amountAfterAdminDeduction;
    });

    if (date) {
      const parsedDate = moment(date, "DD-MM-YYYY"); // Parse the query date
      const startDate = parsedDate.startOf("day").valueOf(); // Start of the day in milliseconds
      const endDate = parsedDate.endOf("day").valueOf(); // End of the day in milliseconds

      const selectedDatePayments = getpayment.filter(
        (item) => item.bookingDate >= startDate && item.bookingDate <= endDate
      );

      let dateWiseEarnings = [];

      selectedDatePayments.forEach((item) => {
        dateWiseEarnings.push({
          dateWiseEarning: item.amountAfterAdminDeduction,
          handlerName: item.handlerId.handlerName,
          bookingDate: item.bookingDate,
        });
      });

      if (selectedDatePayments.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No data found for the specified date",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Earning found successfully",
        data: dateWiseEarnings,
      });
    }

    return res.status(200).json({
      success: true,
      message: "earning found successfully",
      data: {
        totalEarning,
        last30DaysEarning,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//handler balance

export const checkHandlerBalance = async (req, res) => {
  try {
    const { user_id } = req.user;

    const handler = await authModel
      .findOne({ _id: user_id, userType: "handlers" })
      .populate("profile");

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    const handlerAccountId = handler.profile.handlerAccountId;

    try {
      const balance = await getBalance({ accountId: handlerAccountId });
      // Convert cents to dollars and format amount
      function formatAmount(amountInCents) {
        const amountInDollars = amountInCents / 100;
        return `${amountInDollars.toFixed(2)}`;
      }

      const availableBalance = formatAmount(balance.available[0].amount);
      const pendingBalance = formatAmount(balance.pending[0].amount);

      return res.status(200).json({
        success: true,
        message: "Balance found successfully",
        data: {
          availableBalance: availableBalance,
          pendingBalance: pendingBalance,
        },
      });
    } catch (error) {
      console.error("Error fetching balance:", error);
      return res.status(400).json({
        success: false,
        message: "Error fetching balance",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//withdraw amount

export const withDrawAmountHandler = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { amount, destination } = req.body;

    const handler = await authModel
      .findOne({ _id: user_id, userType: "handlers" })
      .populate("profile");

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount not provided",
      });
    }

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: "Destination not provided",
      });
    }

    // Convert amount to cents if it's in dollars
    const amountInCents = amount * 100;
    if (amountInCents <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const handlerAccountId = handler.profile.handlerAccountId;

    // Retrieve balance

    const balance = await getBalance({ accountId: handlerAccountId });

    // Calculate total available balance

    const availableBalance = balance.instant_available[0].amount;

    if (amountInCents > availableBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }
    const payout = await createPayout({
      amount: amountInCents,
      destination, // Use the dynamic external account ID
      accountId: handlerAccountId, // Use the handler's account ID
    });

    //notification send to the handler

    const notificationObjHandler = {
      deviceToken: handler.deviceToken,
      title: "withdraw request",
      body: `you have withdraw ${amount} dollar`,
      auth: handler._id,
    };

    const createNotificationHandler = new handlerNotificationModel(
      notificationObjHandler
    );
    const saveHandler = createNotificationHandler.save();

    try {
      await pushNotification(createNotificationHandler);
    } catch (error) {
      console.log(error.message);
    }

    return res.status(200).json({
      success: true,
      message: "Payout successfully",
      data: payout,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all transaction

export const getAllTransaction = async (req, res) => {
  try {
    const { user_id } = req.user;

    const handler = await authModel
      .findOne({
        _id: user_id,
        userType: "handlers",
      })
      .populate("profile");

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }
    const connectedAccountId = handler.profile.handlerAccountId; // Replace with the actual path to connected account ID in the profile

    // Define options object for balance transactions retrieval
    const options = {
      limit: 10, // Limit the number of transactions to retrieve
      stripeAccount: connectedAccountId, // ID of the connected account
    };

    // Retrieve balance transactions for the connected account
    const transactions = await stripeInstance.balanceTransactions.list(options);
    const transferTransactions = transactions.data.filter((transaction) => {
      return transaction.type === "payout";
    });

    // Filter transactions to include only those involving transfers to bank accounts

    return res.status(200).json({
      success: true,
      message: "Bank transactions retrieved successfully",
      data: transferTransactions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

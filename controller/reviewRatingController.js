import authModel from "../model/authModel.js";
import bookingModel from "../model/bookingModel.js";
import handlerModel from "../model/handlerModel.js";
import paymentModel from "../model/paymentModel.js";
import petsModel from "../model/petsModel.js";

import reviewRatingPetsModel from "../model/petsReviewRatingModel.js";
// import reviewPetsModel from "../model/petsReviewModel.js"
import serviceRatingModel from "../model/serviceRatingModel.js";
import mongoose from "mongoose";
import userNotificationModel from "../model/userNotificationModel.js";
import pushNotification from "../middleware/pushNotification.js";
import handlerNotificationModel from "../model/handlerNotificationModel.js";
import replyModel from "../model/replyModel.js";

export const petsRatingReviewAndServiceRating = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { petRating, petReview, serviceRating, pets, service } = req.body;

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
      { field: petRating, message: "petRating not provide" },
      { field: petReview, message: "petReview not provide" },
      { field: serviceRating, message: "serviceRating not provide" },
      { field: pets, message: "pets not provide" },
    ];

    for (const fieldObj of requiredFields) {
      if (!fieldObj.field) {
        return res.status(400).json({
          success: false,
          message: fieldObj.message,
        });
      }
    }

    const findpet = await petsModel.findOne({ _id: pets }).populate({
      path: "profile",
      populate: { path: "auth" }, // Populate the `auth` field inside `handlerId`
    });

    if (!findpet) {
      return res.status(400).json({
        success: false,
        message: "pet not found",
      });
    }

    const checkBookingComplete = await bookingModel.findOne({
      userId: user.profile._id,
      petId: findpet._id,
      isCompleted: true,
    });

    if (!checkBookingComplete) {
      return res.status(400).json({
        success: false,
        message:
          "you are not able to give rating or review to the pets and service",
      });
    }
    //create review rating for pets

    const createPetRatingReview = new reviewRatingPetsModel({
      petReview,
      petRating,
      pets: pets,
      authid: user_id,
    });

    const PetRatingReview = await createPetRatingReview.save();

    const saveratinginpetsmodel = await petsModel.findByIdAndUpdate(
      findpet._id,
      {
        $push: {
          petRatingReview: PetRatingReview._id,
        },
      }
    );

    if (!PetRatingReview) {
      return res.status(400).json({
        success: false,
        message: "rating not give to the pets",
      });
    }

    const ratingService = new serviceRatingModel({
      serviceRating,
      service,
      authid: user_id,
    });

    const RatingService = await ratingService.save();

    const savereviewinhandlermodel = await handlerModel.findByIdAndUpdate(
      service,
      {
        $push: {
          serviceRating: RatingService._id,
        },
      }
    );

    if (!RatingService) {
      return res.status(400).json({
        success: false,
        message: "rating not give to the services",
      });
    }

    //notification send to the user

    const notificationObjUser = {
      deviceToken: user.deviceToken,
      title: "rating and review notification",
      body: `you rate and review for ${findpet.petName} and rate for ${findpet.profile.handlerName}`,
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
      deviceToken: findpet.auth.deviceToken,
      title: "favourite notification",
      body: `${user.profile.userFirstName} rate you and rate review for ${findpet.petName}`,
      auth: findpet.auth._id,
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
      message:
        "review and rating to pets and rating to the service give successfully",
      data: {
        PetRatingReview,
        RatingService,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const totalReviewPets = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { petId } = req.params;

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
    const findpet = await petsModel.findOne({ _id: petId });
    if (!findpet) {
      return res.status(400).json({
        success: false,
        message: "pet not found",
      });
    }

    const reviews = await reviewRatingPetsModel
      .find({ authid: user_id, pets: petId })
      .populate(["authid", { path: "authid", populate: "profile" }]);
    const totalreview = await reviewRatingPetsModel.countDocuments({
      authid: user_id,
      pets: petId,
    });
    if (!reviews) {
      return res.status(400).json({
        success: false,
        message: "pets review not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "review found successfully",
      data: {
        totalreview,
        reviews,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const overAllRatingPets = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { petId } = req.params;
    const user = await authModel.findOne({
      _id: user_id,
      userType: "users",
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if petId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ObjectId format for petId",
      });
    }

    const checkpet = await reviewRatingPetsModel.findOne({ pets: petId });

    if (!checkpet) {
      return res.status(400).json({
        success: false,
        message: "pet id not found",
      });
    }

    const overallRatingPets = await reviewRatingPetsModel.aggregate([
      {
        $group: {
          _id: null,
          overallRating: { $avg: "$petRating" },
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          overallRating: 1, // Include the overallRating field
        },
      },
    ]);

    if (!overallRatingPets || overallRatingPets.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Overall rating not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Overall rating found successfully",
      data: overallRatingPets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const overAllRatingService = async (req, res) => {
  try {
    const { user_id } = req.user;

    const user = await authModel.findOne({
      _id: user_id,
      userType: "users",
    });

    const { serviceId } = req.params;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const checkservice = await serviceRatingModel.findOne({
      service: serviceId,
    });

    if (!checkservice) {
      return res.status(400).json({
        success: false,
        message: "service id not found",
      });
    }

    const overallRatingServices = await serviceRatingModel.aggregate([
      {
        $group: {
          _id: null,
          overallRating: { $avg: "$serviceRating" },
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          overallRating: 1, // Include the overallRating field
        },
      },
    ]);

    if (!overallRatingServices || overallRatingServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Overall rating not found",
      });
    }

    return res.status(200).json({
      success: false,
      message: "Overall rating found successfully",
      data: overallRatingServices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const HandlerReply = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { reply } = req.body;
    const { reviewId } = req.params;
    const handler = await authModel.findOne({
      _id: user_id,
      userType: "handlers",
    });

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    if (!reply) {
      return res.status(400).json({
        success: false,
        message: "reply not provide",
      });
    }

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "review Id not provide",
      });
    }

    const findReview = await reviewRatingPetsModel.findById(reviewId);

    if (!findReview) {
      return res.status(400).json({
        success: false,
        message: "review not found",
      });
    }

    const handlerreply = await new replyModel({
      handlerReply: reply,
      createdBy: user_id,
      reviews: reviewId,
    }).save();

    //reply id save in reviewrating model

    const replyid = await reviewRatingPetsModel.findByIdAndUpdate(
      reviewId,
      {
        $push: {
          replyId: handlerreply._id,
        },
      },
      {
        new: true,
      }
    );

    if (!replyid) {
      return res.status(400).json({
        success: false,
        message: "reply id not save",
      });
    }

    const populatereview = await replyModel
      .findById(handlerreply._id)
      .populate(["reviews", { path: "reviews", populate: "replyId" }]);

    return res.status(200).json({
      success: true,
      message: "handler replied successfully",
      data: populatereview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getHandlerReply = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { reviewId } = req.params;
    const handler = await authModel.findOne({
      _id: user_id,
      userType: "handlers",
    });

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "review id not provide",
      });
    }

    //find review

    const findReview = await reviewRatingPetsModel.findById(reviewId);

    if (!findReview) {
      return res.status(400).json({
        success: false,
        message: "review not found",
      });
    }

    const findReply = await replyModel
      .find({ reviews: findReview._id })
      .populate([
        { path: "createdBy", populate: "profile" },
        { path: "reviews", populate: { path: "authid", populate: "profile" } },
      ])
      .sort({ createdAt: -1 })
      .limit(1);

    if (findReply.length === 0) {
      return res.status(200).json({
        success: false,
        message: "reply not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "reply found successfully",
      data: findReply,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

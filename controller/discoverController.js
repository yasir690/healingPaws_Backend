import pushNotification from "../middleware/pushNotification.js";
import authModel from "../model/authModel.js";
import handlerModel from "../model/handlerModel.js";
import handlerNotificationModel from "../model/handlerNotificationModel.js";
import likePetModel from "../model/likePetModel.js";
import petsModel from "../model/petsModel.js";
import userNotificationModel from "../model/userNotificationModel.js";

//favorite discover data

export const likeDiscoverData = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { petId } = req.body;

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

    const pet = await petsModel.findById(petId).populate("auth");

    if (!pet) {
      return res.status(400).json({
        success: false,
        message: "pets not found",
      });
    }

    const alreadylikepet = await likePetModel.findOne({
      auth: user_id,
      petId: petId,
    });

    if (alreadylikepet) {
      return res.status(400).json({
        success: false,
        message: "already like this pet",
      });
    }

    const createlikepet = new likePetModel({
      petId,
      auth: user_id,
    });

    const savelikepet = await createlikepet.save();

    if (!savelikepet) {
      return res.status(400).json({
        success: false,
        message: "like pet not save",
      });
    }

    //notification send to the user

    const notificationObjUser = {
      deviceToken: user.deviceToken,
      title: "favourite notification",
      body: `you like ${pet.petName}`,
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
      deviceToken: pet.auth.deviceToken,
      title: "favourite notification",
      body: `your pet is like from ${user.profile.userFirstName}`,
      auth: pet.auth._id,
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
      message: "like pet successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//get like discover data

export const getLikeDiscoverData = async (req, res) => {
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

    const getlike = await likePetModel
      .find({ auth: user_id })
      .populate({
        path: "petId",
        populate: [{ path: "profile" }, { path: "petRatingReview" }],
      })
      .lean();

    let handlerLongitude;
    let handlerLatitude;

    getlike.forEach((item) => {
      handlerLongitude = item.petId.profile.handlerLocation.coordinates[1];
      handlerLatitude = item.petId.profile.handlerLocation.coordinates[0];
    });

    getlike.forEach((item) => {
      const distance = calculateDistanceInMiles(
        user.profile.userLocation.coordinates[1],
        user.profile.userLocation.coordinates[0],
        handlerLongitude,
        handlerLatitude
      );
      item.distance = distance;
    });

    getlike.forEach((like) => {
      let totalRating = 0;
      let totalReviews = 0;
      like.petId.petRatingReview.forEach((data) => {
        totalRating += data.petRating;
        totalReviews++;
      });
      if (totalReviews > 0) {
        const overallRating = totalRating / totalReviews;
        like.overallRating = overallRating;
      } else {
        like.overallRating = 0;
      }
    });

    if (!getlike) {
      return res.status(400).json({
        success: false,
        message: "pet likes not found",
      });
    }

    return res.status(200).json({
      success: false,
      message: "pet likes found successfully",
      data: getlike,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//get discover data by miles

export const getDiscoverDataByMiles = async (req, res) => {
  try {
    const { user_id } = req.user;
    const {
      petCategory,
      city,
      miles,
      userLongitude,
      userLatitude,
      skip = 0,
      limit = 10,
    } = req.query;
    if (petCategory && city && miles) {
      console.log("Query Parameters:", { miles });

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

      const foundcity = await handlerModel
        .findOne({
          handlerCity: city,
        })
        .populate(["pets"]);

      if (!foundcity) {
        return res.status(400).json({
          success: false,
          message: "city not found",
        });
      }

      var milesToRadian = function (miles) {
        var earthRadiusInMiles = 3959;
        return miles / earthRadiusInMiles;
      };

      const options = {
        handlerLocation: {
          $geoWithin: {
            $centerSphere: [
              [parseFloat(userLongitude), parseFloat(userLatitude)], // Center coordinates
              milesToRadian(miles), // Radius in radians
            ],
          },
        },
      };

      const services = await handlerModel
        .find(options)
        .sort({ handlerLocation: 1 })
        .skip(skip)
        .limit(limit)
        .populate([
          "auth",
          {
            path: "pets",
            populate: "petRatingReview",
          },
        ])
        .lean();

      if (!services || services.length === 0) {
        return res.status(400).json({
          success: false,
          message: "services not found",
        });
      }

      // Calculate and add distance for each service
      services.forEach((service) => {
        const distance = calculateDistanceInMiles(
          userLatitude,
          userLongitude,
          service.handlerLocation.coordinates[1],
          service.handlerLocation.coordinates[0]
        );
        service.distance = distance;
      });

      services.forEach((service) => {
        let totalRating = 0;
        let totalReviews = 0;

        service.pets.forEach((pet) => {
          pet.petRatingReview.forEach((review) => {
            totalRating += review.petRating;
            totalReviews++;
          });
        });

        if (totalReviews > 0) {
          const overallRating = totalRating / totalReviews;
          service.overallRating = overallRating;
        } else {
          service.overallRating = 0;
        }
      });
      return res.status(200).json({
        success: true,
        message: "Services found successfully",
        data: services,
      });
    } else {
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

      var milesToRadian = function (miles) {
        var earthRadiusInMiles = 3959;
        return miles / earthRadiusInMiles;
      };

      const options = {
        handlerLocation: {
          $geoWithin: {
            $centerSphere: [
              [parseFloat(userLongitude), parseFloat(userLatitude)], // Center coordinates
              milesToRadian(miles), // Radius in radians
            ],
          },
        },
      };

      const services = await handlerModel
        .find(options)
        .sort({ handlerLocation: 1 })
        .skip(skip)
        .limit(limit)
        .populate([
          "auth",
          {
            path: "pets",
            populate: "petRatingReview",
          },
        ])
        .lean();

      if (!services || services.length === 0) {
        return res.status(400).json({
          success: false,
          message: "services not found",
        });
      }

      // Calculate and add distance for each service
      services.forEach((service) => {
        const distance = calculateDistanceInMiles(
          userLatitude,
          userLongitude,
          service.handlerLocation.coordinates[1],
          service.handlerLocation.coordinates[0]
        );
        service.distance = distance;
      });

      // Calculate overall rating and update response data
      services.forEach((service) => {
        let totalRating = 0;
        let totalReviews = 0;

        service.pets.forEach((pet) => {
          pet.petRatingReview.forEach((review) => {
            totalRating += review.petRating;
            totalReviews++;
          });
        });

        if (totalReviews > 0) {
          const overallRating = totalRating / totalReviews;
          service.overallRating = overallRating;
        } else {
          service.overallRating = 0;
        }
      });

      return res.status(200).json({
        success: true,
        message: "Services found successfully",
        data: services,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

function calculateDistanceInMiles(
  userLatitude,
  userLongitude,
  handlerLatitude,
  handlerLongitude
) {
  const earthRadiusInMiles = 3958.8;
  const lat1 = toRadians(userLatitude);
  const lon1 = toRadians(userLongitude);
  const lat2 = toRadians(handlerLatitude);
  const lon2 = toRadians(handlerLongitude);
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceInMiles = earthRadiusInMiles * c;
  console.log(`Distance calculated: ${distanceInMiles} miles`);

  return distanceInMiles;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

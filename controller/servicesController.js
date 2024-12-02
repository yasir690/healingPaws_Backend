import authModel from "../model/authModel.js";
import handlerModel from "../model/handlerModel.js";
import petsModel from "../model/petsModel.js";

//get all services

export const getAllServices = async (req, res) => {
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
    let overAllServiceRating = 0;

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
        .populate(["auth", "pets", "serviceRating"])
        .lean();

      // Now, the 'distance' field will be included in each document of the 'services' array.
      //   console.log(services);

      if (!services || services.length === 0) {
        return res.status(400).json({
          success: false,
          message: "services not found",
        });
      }
      // console.log("Services before response:", services);

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

        // Calculate total rating and reviews from serviceRating
        service.serviceRating.forEach((rating) => {
          totalRating += rating.serviceRating;
          totalReviews++;
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
        .populate(["auth", "pets"])
        .lean();

      // Now, the 'distance' field will be included in each document of the 'services' array.
      //   console.log(services);

      if (!services || services.length === 0) {
        return res.status(400).json({
          success: false,
          message: "services not found",
        });
      }
      // console.log("Services before response:", services);

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

        // Calculate total rating and reviews from serviceRating
        service.serviceRating.forEach((rating) => {
          totalRating += rating.serviceRating;
          totalReviews++;
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
  // console.log(`Distance calculated: ${distanceInMiles} miles`);

  return distanceInMiles;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

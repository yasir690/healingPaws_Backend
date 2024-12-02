import authModel from "../model/authModel.js";
import handlerModel from "../model/handlerModel.js";
import petsModel from "../model/petsModel.js";
import { uploadFileWithFolder } from "../utils/awsFileUpload.js";
import { handleMultiPartData } from "../utils/mutliPartData.js";

//add pets

export const addPets = [
  handleMultiPartData.fields([
    {
      name: "petsImages",
      maxCount: 10,
    },
    {
      name: "petsCertificate",
      maxCount: 1,
    },
  ]),

  async (req, res) => {
    try {
      const { user_id } = req.user;
      const { petName, petCategory, petDescription, pricePerHours } = req.body;
      const { files } = req;
      // console.log(files,'files');
      let petCertificateLocation = "";
      let petImageLocation = "";

      let petsImagesLocations = []; // Initialize the array to hold the locations of all uploaded pet images

      if (files.petsImages && Array.isArray(files.petsImages)) {
        for (const file of files.petsImages) {
          const fileName = file.originalname;
          const fileContent = file.buffer;

          // Upload each pet image to your storage and get its location
          petImageLocation = await uploadFileWithFolder(
            fileName,
            "pets",
            fileContent
          );

          // Push the location of the uploaded pet image to the array
          petsImagesLocations.push(petImageLocation);
        }
      }

      if (files.petsCertificate) {
        const file = files.petsCertificate[0];
        const fileName = file.originalname;
        const fileContent = file.buffer;

        petCertificateLocation = await uploadFileWithFolder(
          fileName,
          "pets",
          fileContent
        );
      }
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

      // Validate required fields
      const requiredFields = [
        { field: petName, message: "petName not provide" },
        { field: petCategory, message: "petCategory not provide" },
        { field: petDescription, message: "petDescription not provide" },
        { field: pricePerHours, message: "pricePerHours not provide" },
      ];

      for (const fieldObj of requiredFields) {
        if (!fieldObj.field) {
          return res.status(400).json({
            success: false,
            message: fieldObj.message,
          });
        }
      }

      const profileId = handler.profile;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: "profile id not found",
        });
      }

      const create = new petsModel({
        petName,
        petCategory,
        petDescription,
        pricePerHours,
        petsImages: petsImagesLocations,
        petsCertificate: petCertificateLocation,
        profile: profileId,
        auth: user_id,
      });

      const save = await create.save();

      // Add the new pet's ID to the handler's profile
      const updatehandler = await handlerModel.findOneAndUpdate(
        { _id: profileId },
        {
          $push: {
            pets: save._id,
          },
        },
        { new: true }
      );

      if (!save || !updatehandler) {
        return res.status(400).json({
          success: false,
          message: "pet not added",
        });
      }

      return res.status(200).json({
        success: true,
        message: "pet added successfully",
        data: save,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
];

//get pets

export const getPets = async (req, res) => {
  try {
    const { user_id } = req.user;
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

    const profile = handler.profile;
    const getpets = await petsModel
      .find({ profile: profile })
      .populate([
        {
          path: "petRatingReview",
          populate: [
            { path: "authid", populate: "profile" },
            { path: "replyId", options: { strictPopulate: false } }, // Set strictPopulate to false
          ],
        },
      ])
      .lean();

    getpets.forEach((pet) => {
      let totalRating = 0;
      let totalReviews = 0;

      // Calculate total rating and reviews from petRatingReview
      pet.petRatingReview.forEach((rating) => {
        totalRating += rating.petRating;
        totalReviews++;
      });

      if (totalReviews > 0) {
        const overallRating = totalRating / totalReviews;
        // Update the overallRating property for each pet
        pet.overallRating = overallRating;
      } else {
        // If there are no reviews, set overallRating to 0
        pet.overallRating = 0;
      }
    });

    if (!getpets) {
      return res.status(400).json({
        success: false,
        message: "pets not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "pets found successfully",
      data: getpets,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//delete pets

export const deletePet = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { petId } = req.params;
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

    const profile = handler.profile;

    const profiles = await handlerModel.findById(profile);

    if (!profiles) {
      return res.status(400).json({
        success: false,
        message: "profile id not found",
      });
    }

    const petdelete = await petsModel.findByIdAndDelete(petId);

    await handlerModel.findByIdAndUpdate(profile, {
      $pull: { pets: petdelete._id },
    });

    return res.status(200).json({
      success: true,
      message: "pets delete successfully",
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      message: error.message,
    });
  }
};

//edit pets

export const editPet = [
  handleMultiPartData.fields([
    {
      name: "petsImages",
      maxCount: 10,
    },
    {
      name: "petsCertificate",
      maxCount: 1,
    },
  ]),

  async (req, res) => {
    try {
      const { user_id } = req.user;

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
      const { petId } = req.params;
      let petsImagesLocations = []; // Array to hold the locations of all uploaded pet images
      let petCertificateLocation = "";
      const { files } = req;
      // Check if there are pet images uploaded
      let petImageLocation = "";

      if (files.petsImages && Array.isArray(files.petsImages)) {
        for (const file of files.petsImages) {
          const fileName = file.originalname;
          const fileContent = file.buffer;

          // Upload each pet image to your storage and get its location
          petImageLocation = await uploadFileWithFolder(
            fileName,
            "pets",
            fileContent
          );

          // Push the location of the uploaded pet image to the array
          petsImagesLocations.push(petImageLocation);
        }
      }
      if (files.petsCertificate) {
        const file = files.petsCertificate[0];
        const fileName = file.originalname;
        const fileContent = file.buffer;

        petCertificateLocation = await uploadFileWithFolder(
          fileName,
          "pets",
          fileContent
        );
      }
      const { petName, petCategory, petDescription, pricePerHours } = req.body;

      const updateObj = {};

      // Check each field and add it to the update object if present
      if (petName !== undefined) {
        updateObj.petName = petName;
      }
      if (petCategory !== undefined) {
        updateObj.petCategory = petCategory;
      }
      if (petDescription !== undefined) {
        updateObj.petDescription = petDescription;
      }
      if (pricePerHours !== undefined) {
        updateObj.pricePerHours = pricePerHours;
      }

      const findPet = await petsModel.findOne({ _id: petId, auth: user_id });

      if (!findPet) {
        return res.status(400).json({
          success: false,
          message: "pets not found",
        });
      }

      // Handle image and video updates if files are present
      if (files) {
        if (files.petsCertificate && files.petsCertificate[0]) {
          updateObj.petsCertificate = petCertificateLocation;
        }

        if (files.petsImages) {
          updateObj.petsImages = petsImagesLocations;
        }
      }

      const petUpdate = await petsModel.findOneAndUpdate(
        { _id: petId, auth: user_id },
        updateObj,
        { new: true }
      );

      if (!petUpdate) {
        return res.status(400).json({
          success: false,
          message: "pets not update",
        });
      }

      return res.status(200).json({
        success: true,
        message: "pets update successfully",
        data: petUpdate,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
];

import feedBackModel from "../model/feedBackModel.js";
import authModel from "../model/authModel.js";
import { handleMultiPartData } from "../utils/mutliPartData.js";
import { uploadFileWithFolder } from "../utils/awsFileUpload.js";
import adminModel from "../model/adminModel.js";
import adminNotificationModel from "../model/adminNotificationModel.js";
import pushNotification from "../middleware/pushNotification.js";

//user feed back

export const userFeedBack = [
  handleMultiPartData.fields([{ name: "Images", maxCount: 10 }]),
  async (req, res) => {
    try {
      const { user_id } = req.user;
      const { Subject, Message } = req.body;
      const { files } = req;
      let ImageLocation = "";

      let ImagesLocations = []; // Initialize the array to hold the locations of all uploaded pet images

      if (files.Images && Array.isArray(files.Images)) {
        for (const file of files.Images) {
          const fileName = file.originalname;
          const fileContent = file.buffer;

          // Upload each pet image to your storage and get its location
          ImageLocation = await uploadFileWithFolder(
            fileName,
            "feedback",
            fileContent
          );

          // Push the location of the uploaded pet image to the array
          ImagesLocations.push(ImageLocation);
        }
      }
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
      if (!files || !Array.isArray(files.Images) || files.Images.length === 0) {
        console.log("Images not provided:", files);
        return res
          .status(400)
          .json({ success: false, message: "Images not provided" });
      }

      const findadmin = await adminModel.findOne().populate("auth");

      console.log(findadmin.auth.deviceToken);
      // return ""
      const create = new feedBackModel({
        Subject,
        Message,
        createdBy: user_id,
        Images: ImagesLocations,
      });

      const savefeedback = await create.save();

      const notificationObj = {
        deviceToken: findadmin.auth.deviceToken,
        title: "User Feed",
        body: `User Feed Receive from ${user.profile.userFirstName}`,
      };

      const createNotification = new adminNotificationModel(notificationObj);
      const save = createNotification.save();

      try {
        await pushNotification(notificationObj);
      } catch (error) {
        console.log(error.message);
      }
      if (!save) {
        return res.status(400).json({
          success: false,
          message: "feed back not save",
        });
      }

      return res.status(200).json({
        success: false,
        message: "feed back save successfully",
        data: savefeedback,
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
];

//handler feed back

export const handlerFeedBack = [
  handleMultiPartData.fields([{ name: "Images", maxCount: 10 }]),

  async (req, res) => {
    try {
      const { user_id } = req.user;
      const { Subject, Message } = req.body;
      const { files } = req;
      let ImageLocation = "";

      let ImagesLocations = []; // Initialize the array to hold the locations of all uploaded pet images

      if (files.Images && Array.isArray(files.Images)) {
        for (const file of files.Images) {
          const fileName = file.originalname;
          const fileContent = file.buffer;

          // Upload each pet image to your storage and get its location
          ImageLocation = await uploadFileWithFolder(
            fileName,
            "feedback",
            fileContent
          );

          // Push the location of the uploaded pet image to the array
          ImagesLocations.push(ImageLocation);
        }
      }

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

      if (!files) {
        return res.status(400).json({
          success: false,
          message: "images not provide",
        });
      }

      const findadmin = await adminModel.findOne().populate("auth");

      const createFeedBack = new feedBackModel({
        Subject,
        Message,
        Images: ImagesLocations,
        createdBy: user_id,
      });

      const saveFeedBack = await createFeedBack.save();

      if (!saveFeedBack) {
        return res.status(400).json({
          success: false,
          message: "feed back not send",
        });
      }

      const notificationObj = {
        deviceToken: findadmin.auth.deviceToken,
        title: "Handler Feed",
        body: `Handler Feed Receive from ${handler.profile.handlerName}`,
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
        message: "feed back send successfully",
        data: saveFeedBack,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
];

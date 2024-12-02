import userNotificationModel from "../model/userNotificationModel.js";
import authModel from "../model/authModel.js";

//get all notification

export const getAllUserNotification = async (req, res) => {
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

    const allnotification = await userNotificationModel
      .find({ auth: user_id })
      .populate({ path: "auth", populate: "profile" });

    if (!allnotification || allnotification.length === 0) {
      return res.status(400).json({
        success: false,
        message: "user notification not found",
      });
    }

    const response = allnotification.map((item) => {
      return {
        _id: item._id,
        title: item.title,
        body: item.body,
        userFirstName: item.auth.profile.userFirstName,
        userProfileImage: item.auth.profile.userProfileImage,
        isRead: item.isRead,
      };
    });

    return res.status(200).json({
      success: true,
      message: "notification found successfully",
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//read notification

export const userReadNotification = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await authModel.findOne({
      _id: user_id,
      userType: "users",
    });
    const { userNotificationId } = req.params;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const findnotification = await userNotificationModel.findById(
      userNotificationId
    );

    if (!findnotification) {
      return res.status(400).json({
        success: false,
        message: "user notification not found",
      });
    }
    const readnotification = await userNotificationModel.findByIdAndUpdate(
      findnotification._id,
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!readnotification) {
      return res.status(400).json({
        success: false,
        message: "notification not read",
      });
    }

    return res.status(200).json({
      success: true,
      message: "notification read successfully",
      data: readnotification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//on and off notification

export const onAndOffUserNotification = async (req, res) => {
  try {
    const { user_id } = req.user;
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

    // Toggle notificationOnAndOff property
    user.notificationOnAndOff = !user.notificationOnAndOff;

    await user.save();

    let message = user.notificationOnAndOff
      ? "Notification On Successfully"
      : "Notification Off Successfully";

    return res.status(200).json({
      success: true,
      message: message,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

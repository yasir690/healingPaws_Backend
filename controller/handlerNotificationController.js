import handlerNotificationModel from "../model/handlerNotificationModel.js";

import authModel from "../model/authModel.js";

//get all handler notification

export const getAllHandlerNotification = async (req, res) => {
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

    const allnotification = await handlerNotificationModel
      .find({ auth: user_id })
      .populate({ path: "auth", populate: "profile" });

    if (!allnotification || allnotification.length === 0) {
      return res.status(400).json({
        success: false,
        message: "notification not found",
      });
    }
    const response = allnotification.map((item) => {
      return {
        _id: item._id,
        title: item.title,
        body: item.body,
        handlerName: item.auth.profile.handlerName,
        handlerProfilePhoto: item.auth.profile.handlerProfilePhoto,
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

//handler read notification

export const handlerReadNotification = async (req, res) => {
  try {
    const { user_id } = req.user;
    const handler = await authModel.findOne({
      _id: user_id,
      userType: "handlers",
    });
    const { handlerNotificationId } = req.params;

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    const findnotification = await handlerNotificationModel.findById(
      handlerNotificationId
    );

    if (!findnotification) {
      return res.status(400).json({
        success: false,
        message: "handler notification not found",
      });
    }

    const readnotification = await handlerNotificationModel.findByIdAndUpdate(
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

//on and off handler notification

export const onAndOffHandlerNotification = async (req, res) => {
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

    // Toggle notificationOnAndOff property
    handler.notificationOnAndOff = !handler.notificationOnAndOff;

    await handler.save();

    let message = handler.notificationOnAndOff
      ? "Notification On Successfully"
      : "Notification Off Successfully";

    return res.status(200).json({
      success: true,
      message: message,
      data: handler,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

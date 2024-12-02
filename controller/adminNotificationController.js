import adminNotificationModel from "../model/adminNotificationModel.js";

import authModel from "../model/authModel.js";

//get all admin notification

export const getAllAdminNotification = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const allnotification = await adminNotificationModel.find({
      auth: user_id,
    });

    if (!allnotification || allnotification.length === 0) {
      return res.status(400).json({
        success: false,
        message: "notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "notification found successfully",
      data: allnotification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//admin read notification

export const adminReadNotification = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { Id } = req.params;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const readnotification = await adminNotificationModel.findByIdAndUpdate(
      Id,
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

//on and off admin notification

export const onAndOffAdminNotification = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    admin.notificationOnAndOff = !admin.notificationOnAndOff;

    await admin.save();

    let message = notificationOnAndOff
      ? "Notification On Successfully"
      : "Notification Off Successfully";

    return res.status(200).json({
      success: false,
      message: message,
      data: admin,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

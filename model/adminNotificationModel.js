import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },

    body: {
      type: String,
      default: "",
    },

    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const adminNotificationModel = mongoose.model(
  "adminnotification",
  adminNotificationSchema
);

export default adminNotificationModel;

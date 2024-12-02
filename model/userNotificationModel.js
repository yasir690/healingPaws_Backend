import mongoose from "mongoose";

const userNotificationSchema = new mongoose.Schema({
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
});

const userNotificationModel = mongoose.model(
  "usernotification",
  userNotificationSchema
);

export default userNotificationModel;

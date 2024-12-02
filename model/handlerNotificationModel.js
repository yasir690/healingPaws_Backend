import mongoose from "mongoose";

const handlerNotificationSchema = new mongoose.Schema({
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

const handlerNotificationModel = mongoose.model(
  "handlernotification",
  handlerNotificationSchema
);

export default handlerNotificationModel;

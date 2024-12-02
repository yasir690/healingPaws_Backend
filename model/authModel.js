import mongoose from "mongoose";

const authSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: false,
    match: [
      /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    ],
  },

  handlerEmail: {
    type: String,
    required: false,
    match: [
      /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    ],
  },

  adminEmail: {
    type: String,
    required: false,
    match: [
      /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    ],
  },

  adminPassword: {
    type: String,
    required: false,
  },

  userNumber: {
    type: String,
    required: false,
  },
  handlerNumber: {
    type: String,
    required: false,
  },

  deviceType: {
    type: String,
    enum: ["Android", "Ios", "Web"],
  },

  deviceToken: {
    type: String,
  },

  socialType: {
    type: String,
    enum: ["apple", "facebook", "google"],
  },
  accessToken: {
    type: String,
    required: false,
  },
  userType: {
    type: String,
    enum: ["users", "handlers", "admin"],
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "userType",
    required: false,
  },
  otpEmail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "otps",
  },
  otpNumber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "otps",
  },

  otpVerified: {
    type: Boolean,
    default: false,
  },

  notificationOnAndOff: {
    type: Boolean,
    default: true,
  },
});

const authModel = mongoose.model("auth", authSchema);

export default authModel;

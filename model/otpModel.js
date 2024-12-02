import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
    },
    otpKey: {
      type: String,
      required: false,
    },
    otpNumber: {
      type: String,
      required: false,
    },
    otpUsed: {
      type: Boolean,
      default: false,
    },
    otpType: {
      type: String,
      enum: ["Email", "Number"],
    },
    reason: {
      type: String,
      enum: ["SignUp", "SignIn"],
    },
    expiresAt: {
      type: Date,
      default: Date.now,
      index: { expires: "1h" }, // TTL index that expires after 1 hour
    },
  },
  {
    timestamps: true,
  }
);

const otpModel = mongoose.model("otps", otpSchema);

export default otpModel;

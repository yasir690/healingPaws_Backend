import mongoose from "mongoose";

const refundRequestSchema = new mongoose.Schema({
  refundReason: {
    type: String,
    enum: [
      "CHANGE IN PLAN",
      "EMERGENCY REASON",
      "PET IN TIDY CONDITION",
      "INTERESTED IN ANOTHER PET",
      "OTHER",
    ],
  },
  description: {
    type: String,
  },
  authId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "payment",
  },
});

const refundRequestModel = mongoose.model("refundrequest", refundRequestSchema);

export default refundRequestModel;

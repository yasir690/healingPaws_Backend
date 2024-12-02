import mongoose from "mongoose";

const refundPolicySchema = new mongoose.Schema({
  refundPolicy: {
    type: String,
    required: true,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },
  Role: {
    type: String,
    enum: ["users", "handler"],
  },
});

const refundModel = mongoose.model("refundpolicy", refundPolicySchema);

export default refundModel;

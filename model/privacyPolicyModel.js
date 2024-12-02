import mongoose from "mongoose";

const privacySchema = new mongoose.Schema({
  privacyPolicy: {
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

const privacyModel = mongoose.model("privacypolicy", privacySchema);

export default privacyModel;

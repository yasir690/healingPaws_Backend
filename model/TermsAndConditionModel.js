import mongoose from "mongoose";

const termsAndConditionSchema = new mongoose.Schema({
  termsAndCondition: {
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

const termsAndConditionModel = mongoose.model(
  "termsandcondition",
  termsAndConditionSchema
);

export default termsAndConditionModel;

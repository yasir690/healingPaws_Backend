import mongoose from "mongoose";

const serviceRatingSchema = new mongoose.Schema({
  serviceRating: {
    type: Number,
    required: false,
  },

  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "handlers",
  },

  authid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },

  overallRating: {
    type: Number,
  },
});

const serviceRatingModel = mongoose.model("servicerating", serviceRatingSchema);

export default serviceRatingModel;

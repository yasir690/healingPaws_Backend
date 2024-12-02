import mongoose from "mongoose";

const ratingPetsSchema = new mongoose.Schema({
  petRating: {
    type: Number,
    required: false,
  },
  petReview: {
    type: String,
    required: false,
  },
  pets: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "pets",
  },
  authid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },

  overallRating: {
    type: Number,
  },
  replyId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reply",
    },
  ],
});

const reviewRatingPetsModel = mongoose.model(
  "reviewratingpets",
  ratingPetsSchema
);

export default reviewRatingPetsModel;

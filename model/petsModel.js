import mongoose from "mongoose";

const petsSchema = new mongoose.Schema({
  auth: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "handlers",
  },
  petName: {
    type: String,
    required: false,
  },

  petCategory: {
    type: String,
    enum: ["Cat", "Dog"],
  },
  petDescription: {
    type: String,
    required: false,
  },
  pricePerHours: {
    type: Number,
    required: false,
  },
  petsImages: [
    {
      type: String,
      required: false,
    },
  ],

  petsCertificate: {
    type: String,
    required: false,
  },

  petRatingReview: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reviewratingpets",
      strictPopulate: false,
    },
  ],
});

const petsModel = mongoose.model("pets", petsSchema);

export default petsModel;

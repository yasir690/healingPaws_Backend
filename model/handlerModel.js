import mongoose from "mongoose";

const handlerSchema = new mongoose.Schema({
  auth: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },
  handlerProfilePhoto: {
    type: String,
    default: "",
  },

  handlerCoverPhoto: {
    type: String,
    default: "",
  },
  handlerName: {
    type: String,
    required: false,
  },

  handlerAddress: {
    type: String,
    required: false,
  },

  handlerCity: {
    type: String,
  },
  handlerState: {
    type: String,
  },

  isCreatedProfile: {
    type: Boolean,
    default: false,
  },

  aboutYou: {
    type: String,
    required: false,
  },
  pets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "pets",
    },
  ],
  serviceRating: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "servicerating",
    },
  ],
  handlerLocation: {
    type: {
      type: String,
      default: "Point",
      enum: ["Point"],
    },
    coordinates: [Number],
  },
  handlerAccountId: {
    type: String,
    default: null,
    trim: true,
  },
});

const handlerModel = mongoose.model("handlers", handlerSchema);

handlerModel.collection.createIndex({ handlerLocation: "2dsphere" });

export default handlerModel;

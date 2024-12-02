import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },

  handlerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "handlers",
    strictPopulate: false, // Set strictPopulate to false
  },
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "pets",
  },

  selectedDate: {
    type: Number,
  },
  bookingStartTime: {
    type: Number,
    required: true,
  },

  bookingEndTime: {
    type: Number,
    required: true,
  },

  additional: {
    type: String,
    required: true,
  },

  bookingDate: {
    type: Number,
    required: true,
  },

  isCompleted: {
    type: Boolean,
    default: false,
  },

  isWallet: {
    type: Boolean,
    default: false,
  },
});

const bookingModel = mongoose.model("booking", bookingSchema);

export default bookingModel;

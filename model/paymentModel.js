import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  handlerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "handlers",
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "booking",
    strictPopulate: false, // Set strictPopulate to false
  },

  Charges: {
    type: Number,
    required: true,
  },
  totalTime: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  pay: {
    type: Number,
    // required:true
  },
  deductionFee: {
    type: Number,
  },

  amountAfterAdminDeduction: {
    type: Number,
  },
  createdAt: {
    type: Number,
  },
  isReceived: {
    type: Boolean,
    default: false,
  },
  isRefunded: {
    type: Boolean,
    default: false,
  },
  bookingDate: {
    type: Number,
    required: true,
  },
  paymentIntentId: {
    type: String,
    default: "",
  },
  paymentStatus: {
    type: Boolean,

    default: false,
  },
  completedAt: {
    type: Date, // Add a field to track the completion date
  },
  selectedDate: {
    type: Date,
    default: Date.now,
  },
});

const paymentModel = mongoose.model("payment", paymentSchema);

export default paymentModel;

import mongoose from "mongoose";

const userWalletSchema = new mongoose.Schema(
  {
    authid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
    },
    balance: {
      type: Number,
      default: 0,
    },
    Debit: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "payment",
      },
    ],
    Refunds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "payment",
      },
    ],
  },
  { strictPopulate: false }
); // Set strictPopulate to false

const userWalletModel = mongoose.model("userwallet", userWalletSchema);

export default userWalletModel;

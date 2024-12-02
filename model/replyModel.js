import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  handlerReply: {
    type: String,
    required: true,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },

  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reviewratingpets",
    },
    { strictPopulate: false },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const replyModel = mongoose.model("reply", replySchema);

export default replyModel;

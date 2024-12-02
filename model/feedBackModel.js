import mongoose from "mongoose";

const feedBackSchema = new mongoose.Schema({
  Subject: {
    type: String,
    required: true,
  },
  Message: {
    type: String,
    required: true,
  },
  Images: [{ type: String, default: "" }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },
});

const feedBackModel = mongoose.model("feedback", feedBackSchema);

export default feedBackModel;

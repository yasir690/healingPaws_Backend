import mongoose from "mongoose";

const aboutAppSchema = new mongoose.Schema({
  aboutApp: {
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

const aboutAppModel = mongoose.model("aboutapp", aboutAppSchema);

export default aboutAppModel;

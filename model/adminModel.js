import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  auth: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },

  adminName: {
    type: String,
    validate: {
      validator: (value) => /^[A-Za-z\s]+$/.test(value), // Only alphabetic characters and spaces are allowed
    },
  },

  deviceToken: {
    type: String,
  },
});

const adminModel = mongoose.model("admin", adminSchema);

export default adminModel;

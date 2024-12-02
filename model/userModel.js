import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  auth: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },

  userFirstName: {
    type: String,
    validate: {
      validator: (value) => /^[A-Za-z\s]+$/.test(value), // Only alphabetic characters and spaces are allowed
    },
  },
  userLastName: {
    type: String,
    validate: {
      validator: (value) => /^[A-Za-z\s]+$/.test(value), // Only alphabetic characters and spaces are allowed
    },
  },

  userDateOfBirth: {
    type: Date,
    required: false,
    default: "0",
  },

  userGender: {
    type: String,
    enum: ["Male", "Female", "Transgender", "Nonbinary", "Not Defined"],
    default: "Not Defined",
  },

  userLocation: {
    type: { type: String, default: "Point", enum: ["Point"] },
    coordinates: [Number],
  },

  userAddress: {
    type: String,
    required: false,
  },
  userCity: {
    type: String,
  },

  userState: {
    type: String,
  },
  isCreatedProfile: {
    type: Boolean,
    default: false,
  },

  userProfileImage: {
    type: String,
    default: "",
  },

  customerId: {
    type: String,
    default: "",
    trim: true,
  },

  userWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userwallet",
  },
});

const userModel = mongoose.model("users", userSchema);

userModel.collection.createIndex({ userLocation: "2dsphere" });

export default userModel;

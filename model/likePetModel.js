import mongoose from "mongoose";

const likePetSchema = new mongoose.Schema({
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "pets",
    strictPopulate: false, // Set strictPopulate to false
  },

  auth: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },
});

const likePetModel = mongoose.model("likepet", likePetSchema);

export default likePetModel;

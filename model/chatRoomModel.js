import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema({
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
    },
  ],

  type: {
    type: String,
    enum: ["PRIVATE", "GROUP"],
    default: "PRIVATE",
  },

  matchid: {
    type: mongoose.Schema.Types.ObjectId,
  },

  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "messages",
    },
  ],
  createdAt: {
    type: Number,
  },
});

const chatRoomModel = mongoose.model("chatroom", chatRoomSchema);

export default chatRoomModel;

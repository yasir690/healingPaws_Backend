import mongoose from "mongoose";

const chatRoomMessageSchema = new mongoose.Schema({
  chatroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "chatroom",
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },
  message: {
    type: String,
    required: true,
  },

  messageType: {
    type: String,
    required: true,
    enum: ["TEXT", "IMAGE", "VIDEO", "AUDIO"],
  },

  isRead: {
    type: Boolean,
    default: false,
    required: false,
  },
  createdAt: {
    type: Number,
  },
});

const chatRoomMessageModel = mongoose.model("messages", chatRoomMessageSchema);

export default chatRoomMessageModel;

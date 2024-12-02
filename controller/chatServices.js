import chatRoomModel from "../model/chatRoomModel.js";
import chatRoomMessageModel from "../model/chatRoomMessageModel.js";

export const sendMessages = async (io, data) => {
  try {
    // // Join User to Chatroom
    // io.to(data.user).join(data.chatroom);
    const { chatroom, user, message, messageType } = data;
    const currentTime = Date.now();

    console.log(user);
    // Validate chatroom ID

    const ChatRoomData = await chatRoomModel.findById(chatroom);
    if (!ChatRoomData) {
      return io.to(user).emit("message", {
        status: "error",
        message: "Chat room not found",
      });
    }

    // Check if user is part of the chatroom
    if (!ChatRoomData.users.includes(user)) {
      return io.to(user).emit("message", {
        status: "error",
        message: "User is not part of this chat room",
      });
    }

    // const users = ChatRoomData.users;
    // // const UsersData = await GetAlluserData(users);
    // const newUsersData = await GetAlluserData(users);
    // // Filter out the user who sent the message
    // const newUsersDataFilter = newUsersData.filter(
    //   (user) => user._id.toString() === data.user
    // );

    const newMessage = await chatRoomMessageModel.create({
      //   chatroom: chatroom._id,
      chatroom: chatroom,
      user: user,
      message: message,
      messageType: messageType.toUpperCase(),
      createdAt: currentTime,
    });
    await newMessage.populate("user");
    await chatRoomModel
      .findByIdAndUpdate(
        chatroom,
        {
          $push: { messages: newMessage._id },
        },
        { new: true }
      )
      .populate([
        {
          path: "users",
          populate: [
            {
              path: "profile",
            },
          ],
        },
        {
          path: "messages",
          populate: [
            {
              path: "user",
              populate: [
                {
                  path: "profile",
                },
              ],
            },
          ],
        },
      ]);
    // ).populate("messages");
    // const messageData = {
    //   chatroom: newMessage.chatroom,
    //   user: newUsersDataFilter,
    //   message: newMessage.message,
    //   messageType: messageType.toUpperCase(),
    // };

    // const newUsers = newUsersData.map((user) => user._id.toString());
    // const updateIsRead = await ChatRoomMessagesModel.updateMany(
    //   {
    //     chatroom: chatroom,
    //     user: { $ne: user },
    //   },
    //   {
    //     isRead: true,
    //   }
    // );

    // Convert createdAt to formatted date string
    const formattedCreatedAt = new Date(
      newMessage.createdAt
    ).toLocaleTimeString();

    ChatRoomData.users.forEach((user) => {
      io.to(user.toString()).emit("message", {
        status: "success",
        // data: newMessage,
        data: {
          ...newMessage.toObject(), // Convert Mongoose document to plain object if needed
          createdAt: formattedCreatedAt,
        },

        message: "Message sent successfully",
      });
    });
    // // Send Notification
    // newUsersDataFilter.filter((user) => {
    //   if (user._id.toString() !== data.user) {
    //     sendNotification(
    //       user.userNotificationToken,
    //       "New Message",
    //       "You have a new message"
    //     );
    //   }
    // });
  } catch (error) {
    console.error(error);
  }
};

export const getChatRoomData = async (io, data) => {
  try {
    const { chatroom, user } = data;
    const ChatRoom = await chatRoomModel
      .findOne({
        _id: chatroom,
        users: { $in: [user] },
      })
      .populate([
        {
          path: "users",
          populate: [
            {
              path: "profile",
            },
          ],
        },
        {
          path: "messages",
          populate: [
            {
              path: "user",
              populate: [
                {
                  path: "profile",
                },
              ],
            },
          ],
        },
      ]);
    //   .populate("messages")
    if (!ChatRoom) {
      return io.to(user).emit("getRoom", {
        status: "error",
        message: "Chat room not found",
      });
    }

    const updateIsRead = await chatRoomMessageModel.updateMany(
      {
        chatroom: chatroom,
        user: { $ne: user },
      },
      {
        isRead: true,
      }
    );

    const UpdateChatRoomWithReadMessages = await chatRoomModel
      .findOne({
        _id: chatroom,
        users: { $in: [user] },
      })
      .populate([
        {
          path: "users",
          populate: [
            {
              path: "profile",
            },
          ],
        },
        {
          path: "messages",
          populate: [
            {
              path: "user",
              populate: [
                {
                  path: "profile",
                },
              ],
            },
          ],
        },
      ]);

    // Format createdAt of Chatroom
    const chatroomCreatedAt = new Date(
      UpdateChatRoomWithReadMessages.createdAt
    );
    const formattedChatroomCreatedAt = chatroomCreatedAt.toLocaleTimeString();

    // Format createdAt of Messages
    const formattedMessages = UpdateChatRoomWithReadMessages.messages.map(
      (message) => {
        const messageCreatedAt = new Date(message.createdAt);
        const formattedMessageCreatedAt = messageCreatedAt.toLocaleTimeString();
        return {
          ...message.toObject(), // If using Mongoose documents
          createdAt: formattedMessageCreatedAt,
        };
      }
    );

    io.to(user).emit("getRoom", {
      status: "success",
      // data: ChatRoom,
      // data: UpdateChatRoomWithReadMessages,
      data: {
        ...UpdateChatRoomWithReadMessages.toObject(), // Convert Mongoose document to plain object if needed
        createdAt: formattedChatroomCreatedAt,
        messages: formattedMessages,
      },
      message: "Chat room data fetched successfully",
    });

    // // Emit the message event to update the frontend
    // io.to(chatroom).emit("message", {
    //   status: "success",
    //   data: newMessage, // Assuming you have a newMessage object
    //   message: "New message received",
    // });
  } catch (error) {
    console.error(error);
  }
};

import chatRoomModel from "../model/chatRoomModel.js";
import chatRoomMessageModel from "../model/chatRoomMessageModel.js";
import authModel from "../model/authModel.js";
import moment from "moment";
// moment.utc(); // Set Moment.js to use UTC timezone globally

//create chat room

export const createChatRoom = async (req, res, next) => {
  try {
    // const { users, matchid } = req.body;
    const { users } = req.body;
    const { user_id } = req.user;

    const user = await authModel
      .findOne({
        _id: user_id,
      })
      .populate("profile");

    console.log(user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    // Validate that user_id is not in the users array
    if (users.includes(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Your own ID cannot be included in the users array.",
      });
    }

    const currentTime = Date.now();

    // Validate that only auth IDs are included in the users array
    const invalidProfileIds = users.filter((userId) =>
      userId.toLowerCase().includes(user.profile._id)
    );

    if (invalidProfileIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Profile IDs are not allowed in the users array.",
      });
    }

    const chatType = users.length > 1 ? "GROUP" : "PRIVATE";
    // If ChatType is Group Add matchid
    var Query;
    var chatRoomData;
    if (chatType === "GROUP") {
      Query = {
        users: { $all: [...users, user_id] },
        type: chatType,
        matchid: matchid,
      };
      console.log(Query);
    } else {
      Query = {
        users: { $all: [...users, user_id] },
        type: chatType,
      };
      console.log(Query);
    }
    // Check if chat room already exists
    const chatRoomExists = await chatRoomModel.findOne(Query).populate([
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
        options: {
          sort: { createdAt: -1 }, // Sort messages in descending order of createdAt
        },
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
    if (chatRoomExists) {
      return res.status(200).json({
        success: true,
        data: chatRoomExists,
        message: "Chat room already exists",
      });
    }
    // Create Chat Room
    if (chatType === "GROUP") {
      chatRoomData = {
        users: [...users, user_id],
        type: chatType,
        matchid: matchid,
      };
    } else {
      chatRoomData = {
        users: [...users, user_id],
        type: chatType,
        createdAt: currentTime,
      };
    }
    const chatRoom = await chatRoomModel.create(chatRoomData);
    const populatedChatRoom = await chatRoom.populate([
      {
        path: "users",
        populate: [
          {
            path: "profile",
          },
        ],
      },
    ]);

    res.status(200).json({
      success: true,
      data: populatedChatRoom,
      message: "Chat room created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get chat room

export const getChatRooms = async (req, res) => {
  try {
    const { user_id } = req.user;
    // Populate Latest Message
    // const chatRooms = await ChatRoomsModel.find({
    //   users: { $in: [user_id] },
    //   type: "PRIVATE",
    // }).populate([
    //   {
    //     path: "users",
    //     populate: [
    //       {
    //         path: "profile",
    //       },
    //     ],
    //   },
    //   {
    //     path: "messages",
    //     populate: [
    //       {
    //         path: "user",
    //         populate: [
    //           {
    //             path: "profile",
    //           },
    //         ],
    //       },
    //     ],
    //   },
    // ]);

    // // Remove Item if no messages
    // const chatRoomsWithMessages = chatRooms.filter(
    //   (chatRoom) => chatRoom.messages.length > 0
    // );
    // for (let i = chatRoomsWithMessages.length - 1; i >= 0; i--) {
    //   chatRoomsWithMessages[i].users = chatRoomsWithMessages[i].users.filter(
    //     (item) => item._id.toString() !== user_id
    //   );
    // }
    // // const token =
    // //   req.body.token || req.query.token || req.headers["x-access-token"];
    // // const config = {
    // //   headers: {
    // //     "Content-Type": "application/json",
    // //     "x-access-token": token,
    // //   },
    // // };
    // // const chatRoomsWithUsers = await Promise.all(
    // //   chatRoomsWithMessages.map(async (chatRoom) => {
    // //     const users = await Promise.all(
    // //       chatRoom.users.map(async (user) => {
    // //         const { data } = await axios.get(
    // //           `${process.env.mainserverurl
    // //           }/auth/getUserByUserID/${user.toString()}`,
    // //           config
    // //         );
    // //         return data.data;
    // //       })
    // //     );
    // //     return {
    // //       ...chatRoom._doc,
    // //       users,
    // //     };
    // //   })
    // // );

    // const chatRoomsWithUnreadMessages = await Promise.all(
    //   chatRoomsWithMessages.map(async (chatRoom) => {
    //     const unreadMessages = await ChatRoomMessagesModel.countDocuments({
    //       chatroom: chatRoom._id,
    //       user: { $ne: user_id },
    //       isRead: false,
    //     });
    //     return {
    //       ...chatRoom._doc,
    //       unreadMessages,
    //     };
    //   })
    // );

    // res.status(200).json({
    //   success: true,
    //   // data: chatRoomsWithMessages,
    //   data: chatRoomsWithUnreadMessages,
    //   message: "Chat rooms fetched successfully",
    // });

    // const chatRooms = await chatRoomModel.find({
    //   users: { $in: [user_id] },
    //   type: 'PRIVATE'
    // }).populate([
    //   {
    //     path: 'users',
    //     populate: [
    //       {
    //         path: 'profile'
    //       }
    //     ]
    //   },
    //   {
    //     path: 'messages',
    //     options: {
    //       sort: { createdAt: -1 } // Sort messages in descending order of createdAt
    //     },
    //     populate: [
    //       {
    //         path: 'user',
    //         populate: [
    //           {
    //             path: 'profile'
    //           }
    //         ]
    //       }
    //     ]
    //   }
    // ]);

    // Remove Item if no messages
    // const chatRoomsWithMessagesFilter = chatRooms.filter(
    //   (chatRoom) => chatRoom.messages.length > 0
    // );
    // for (let i = chatRoomsWithMessagesFilter.length - 1; i >= 0; i--) {
    //   chatRoomsWithMessagesFilter[i].users = chatRoomsWithMessagesFilter[
    //     i
    //   ].users.filter((item) => item._id.toString() !== user_id);
    // }

    // const chatRoomsWithMessages = chatRoomsWithMessagesFilter.map(
    //   (chatRoom) => {
    //     const lastMessage =
    //       chatRoom.messages.length > 0 ? chatRoom.messages[0] : null;
    //     return {
    //       ...chatRoom._doc,
    //       messages: lastMessage ? [lastMessage] : [] // Include only the last message
    //     };
    //   }
    // );

    // const chatRoomsWithUnreadMessages = await Promise.all(
    //   chatRoomsWithMessages.map(async (chatRoom) => {
    //     const unreadMessages = await chatRoomMessageModel.countDocuments({
    //       chatroom: chatRoom._id,
    //       user: { $ne: user_id },
    //       isRead: false
    //     });
    //     return {
    //       ...chatRoom,
    //       unreadMessages
    //     };
    //   })
    // );
    // res.status(200).json({
    //   success: true,
    //   data: chatRoomsWithUnreadMessages,
    //   // data:chatRoomsFormatted,
    //   message: 'Chat rooms fetched successfully'
    // });

    const chatRooms = await chatRoomModel
      .find({
        users: { $in: [user_id] },
        type: "PRIVATE",
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
          options: {
            sort: { createdAt: -1 }, // Sort messages in descending order of createdAt
          },
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

    // Format createdAt fields
    const formattedChatRooms = chatRooms.map((room) => ({
      ...room._doc,
      createdAt: new Date(room.createdAt).toLocaleTimeString(), // Format createdAt for room
      messages: room.messages.map((message) => ({
        ...message._doc,
        createdAt: new Date(message.createdAt).toLocaleTimeString(), // Format createdAt for message
      })),
    }));

    // Remove Item if no messages
    const chatRoomsWithMessages = formattedChatRooms.filter(
      (chatRoom) => chatRoom.messages.length > 0
    );

    for (let i = chatRoomsWithMessages.length - 1; i >= 0; i--) {
      chatRoomsWithMessages[i].users = chatRoomsWithMessages[i].users.filter(
        (item) => item._id.toString() !== user_id
      );
    }

    const chatRoomsWithUnreadMessages = await Promise.all(
      chatRoomsWithMessages.map(async (chatRoom) => {
        const unreadMessages = await chatRoomMessageModel.countDocuments({
          chatroom: chatRoom._id,
          user: { $ne: user_id },
          isRead: false,
        });
        return {
          ...chatRoom,
          unreadMessages,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: chatRoomsWithUnreadMessages,
      message: "Chat rooms fetched successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

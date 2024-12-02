import FCM from "fcm-node";
import dotenv from "dotenv";
dotenv.config();
const serverKey = process.env.SERVER_KEY;
const fcm = new FCM(serverKey);

const pushNotification = async (notificationObj) => {
  try {
    var message = {
      to: notificationObj.deviceToken,
      notification: {
        title: notificationObj.title,
        body: notificationObj.body,
      },
    };
    await fcm.send(message, function (error, response) {
      if (error) {
        console.log(notificationObj.deviceToken);
        console.log("something went wrong", error);
      } else {
        console.log("successfully sent", response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

export default pushNotification;

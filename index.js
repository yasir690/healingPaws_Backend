import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dbConnect from "./db/connectivity.js";
import { userRouter } from "./router/userRouter.js";
import { handlerRouter } from "./router/handlerRouter.js";
import { petRouter } from "./router/petRouter.js";
import { discoverRouter } from "./router/discoverRouter.js";
import { userBookingRouter } from "./router/userBookingRouter.js";
import { servicesRouter } from "./router/servicesRouter.js";
import { feedBackRouter } from "./router/feedBackRouter.js";
import { handlerBookingRouter } from "./router/handlerBookingRouter.js";
import { privacyTermsAboutAndRefundRouter } from "./router/privacyTermsAboutAndRefundRouter.js";
import { adminRouter } from "./router/adminRouter.js";
import { chatRouter } from "./router/chatRouter.js";
import { ratingReviewRouter } from "./router/reviewRatingRouter.js";
import { userNotificationRouter } from "./router/userNotificationRouter.js";
import { handlerNotificationRouter } from "./router/handlerNotificationRouter.js";
import * as ChatRoomController from "./controller/chatServices.js";
import { adminNotificationRouter } from "./router/adminNotificationRouter.js";
import { createServer } from "http"; // for local server
import { Server } from "socket.io";
import cron from "node-cron";
import { scheduleCommissionAndPaymentProcessing } from "./utils/scheduleBaseTask.js";
import stripe from "stripe";
import {
  handlePaymentIntentPaymentFailed,
  handlePaymentIntentSucceeded,
} from "./utils/paymentStatus.js";
const stripeInstance = stripe(process.env.STRIPE_KEY);

const apiPrefix = process.env.API_PRIFEX;
const Port = process.env.PORT || 4000;

const app = express();
const httpServer = createServer(app); // for local without https
const io = new Server(httpServer); // for local

app.use(cors());
app.use(express.static("public"));

// Stripe webhook endpoint

app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      // Verify the event
      event = stripeInstance.webhooks.constructEvent(
        req.body,
        sig,
        process.env.END_POINT_SECRET
      );
      console.log(event, "event");

      // Handle the event
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntentSucceeded = event.data.object;
          await handlePaymentIntentSucceeded(paymentIntentSucceeded);
          break;

        case "payment_intent.payment_failed":
          const paymentIntentPaymentFailed = event.data.object;
          await handlePaymentIntentPaymentFailed(paymentIntentPaymentFailed);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      // Respond to Stripe that the event was received successfully
      res.json({ received: true });
    } catch (err) {
      console.log(`Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(apiPrefix, userRouter);
app.use(apiPrefix, handlerRouter);
app.use(apiPrefix, petRouter);
app.use(apiPrefix, servicesRouter);
app.use(apiPrefix, discoverRouter);
app.use(apiPrefix, userBookingRouter);
app.use(apiPrefix, handlerBookingRouter);

app.use(apiPrefix, feedBackRouter);
app.use(apiPrefix, privacyTermsAboutAndRefundRouter);
app.use(apiPrefix, adminRouter);
app.use(apiPrefix, chatRouter);
app.use(apiPrefix, ratingReviewRouter);
app.use(apiPrefix, userNotificationRouter);
app.use(apiPrefix, handlerNotificationRouter);
app.use(apiPrefix, adminNotificationRouter);

dbConnect();

// Schedule the cron job to run daily at midnight

cron.schedule("0 0 * * *", async () => {
  console.log("Running commission and payment processing cron job...");
  await scheduleCommissionAndPaymentProcessing();
});

app.get("/", (req, res) => {
  res.send("welcome to application");
});

io.on("connection", (socket) => {
  // Join Chatroom
  console.log("new connection");
  console.log("connected");
  console.log("socket connection " + socket.id);

  socket.on("joinRoom", (data) => {
    console.log("data_in_joinRoom_in_backend:", data);
    socket.join(data.chatroom);
    socket.join(data.user);
    ChatRoomController.getChatRoomData(io, data);
  });

  // load messages for chatroom
  socket.on("getRoomMessages", (data) => {
    console.log("data_in_get_room_messages:", data);
    ChatRoomController.getChatRoomData(io, data);
  });

  // Leave Chatroom
  socket.on("leaveRoom", ({ chatroom, user }) => {
    socket.leave(chatroom);
    socket.leave(user);
    console.log("Socket Disconnect From Back End");
    console.log(`user left`);
  });

  // Send Message
  socket.on("sendMessage", (data) => {
    ChatRoomController.sendMessages(io, data);
  });

  socket.on("disconnect", () => {
    console.log(`user left`);
  });
});

// app.listen(Port,()=>{
//     console.log(`server is running at : ${Port}`);
// });

httpServer.listen(Port, () => {
  console.log(`server is running at ${Port}`);
});

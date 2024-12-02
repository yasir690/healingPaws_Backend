import nodemailer from "nodemailer";
import { emailConfig } from "../config/emailConfig.js";

const transport = nodemailer.createTransport(emailConfig);

export const sendEmails = async (to, subject, content, next) => {
  console.log("Sending email to:", to);

  try {
    const message = {
      from: {
        name: process.env.MAIL_FROM_NAME,
        address: process.env.MAIL_USERNAME,
      },
      to: to,
      subject: subject,
      html: content,
    };

    console.log("Sending email message:", message);

    await transport.sendMail(message);

    console.log("Email sent successfully");

    if (typeof next === "function") {
      next(); // Call the callback function without an error to proceed
    }
  } catch (error) {
    console.error("Email sending error:", error);

    if (typeof next === "function") {
      next(error); // Call the callback function with the error
    }
  }
};

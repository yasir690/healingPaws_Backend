import otpModel from "../model/otpModel.js";
import handlerModel from "../model/handlerModel.js";
import { randomInt } from "crypto";
import { sendEmails } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import { handleMultiPartData } from "../utils/mutliPartData.js";
import authModel from "../model/authModel.js";

import {
  createConnectedAccount,
  createExternalBankAccount,
  getAllBankDetail,
  getBalance,
  verifyConnectedAccount,
} from "../utils/stripeApis.js";
import { uploadFileWithFolder } from "../utils/awsFileUpload.js";

//handler Signup

export const handlerSignIn = async (req, res) => {
  try {
    const {
      handlerEmail,
      handlerNumber,
      userType,
      deviceType,
      deviceToken,
      otpNumber,
    } = req.body;

    const staticEmail = "devops@theapptitude.com";

    if (!handlerEmail && !handlerNumber) {
      return res.status(400).json({
        success: false,
        message: "Email or Number is not provided",
      });
    }

    if (
      handlerEmail &&
      !handlerEmail.match(
        /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
      )
    ) {
      return res.status(500).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (handlerEmail === staticEmail) {
      const existingUser = await authModel
        .findOne({ handlerEmail: staticEmail })
        .populate("profile");

      if (existingUser) {
        // login functionality

        // const OTP = randomInt(100000, 999999);

        const OTP = "000000";

        //create otp document

        const createOtp = new otpModel({
          auth: existingUser._id,
          otpKey: OTP,
          otpUsed: false,
          otpType: "Email",
          reason: "SignIn",
        });

        const saveOtp = await createOtp.save();

        const emailData = {
          subject: "Healing Paws - Account Login",
          html: `
            <div
              style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
            >
              <div style="z-index:1; position: relative;">
              <header style="padding-bottom: 20px">
                <div class="logo" style="text-align:center;">
                </div>
              </header>
              <main
                style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
              >
                <h1
                  style="color: #fd6835; font-size: 30px; font-weight: 700;"
                >Welcome To Healing Paws</h1>
                <p
                  style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
                >Hi,</p>
                <p
                  style="font-size: 20px; text-align: left; font-weight: 500;"
                >Thank you for Login with us. Please use the following OTP to verify your email address.</p>
                <h2
                  style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #fd6835; text-align: center; margin-top: 20px; margin-bottom: 20px;"
                >${OTP}</h2>
                <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
                style = "color: #a87628; text-decoration: none; border-bottom: 1px solid #a87628;" href = "#"
                >let us know.</a></p>
                <p style = "font-size: 20px;">Regards,</p>
                <p style = "font-size: 20px;">Dev Team</p>
              </main>
              </div>
            <div>
            `,
        };

        const updateOtp = await authModel.findByIdAndUpdate(existingUser._id, {
          otpEmail: saveOtp._id,
        });

        await updateOtp.save();

        sendEmails(
          existingUser.handlerEmail,
          emailData.subject,
          emailData.html
        );

        const formattedOTP = Number(OTP);

        return res.status(200).json({
          success: true,
          message: "code sent successfully",
          data: OTP,
        });
      }
      if (!deviceType) {
        return res.status(400).json({
          success: false,
          message: "device type is not provide",
        });
      }

      if (!deviceToken) {
        return res.status(400).json({
          success: false,
          message: "device token is not provide",
        });
      }

      //create user

      const createUser = new authModel({
        handlerEmail,
        userType,
        deviceType,
        deviceToken,
      });

      const saveUser = await createUser.save();

      const user = await new handlerModel({
        auth: saveUser._id,
        handlerLocation: {
          type: "Point",
          coordinates: [0, 0], // Default coordinates, replace with actual values if available
        },
      }).save();

      await authModel.findByIdAndUpdate(saveUser._id, { profile: user._id });

      if (!saveUser) {
        return res.status(400).json({
          success: false,
          message: "user not save",
        });
      }

      // const OTP = randomInt(100000, 999999);
      const OTP = "000000";
      //create otp document

      const createOtp = new otpModel({
        auth: saveUser._id,
        otpKey: OTP,
        otpUsed: false,
        otpType: "Email",
        reason: "SignUp",
      });

      const emailData = {
        subject: "Healing Paws - Account Verification",
        html: `
    <div
      style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
    >
      <div style="z-index:1; position: relative;">
      <header style="padding-bottom: 20px">
        <div class="logo" style="text-align:center;">
        </div>
      </header>
      <main
        style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
      >
        <h1
          style="color: #fd6835; font-size: 30px; font-weight: 700;"
        >Welcome To Healing Paws</h1>
        <p
          style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
        >Hi,</p>
        <p
          style="font-size: 20px; text-align: left; font-weight: 500;"
        >Thank you for registering with us. Please use the following OTP to verify your email address.</p>
        <h2
          style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #fd6835; text-align: center; margin-top: 20px; margin-bottom: 20px;"
        >${OTP}</h2>
        <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
        style = "color: #a87628; text-decoration: none; border-bottom: 1px solid #a87628;" href = "#"
        >let us know.</a></p>
        <p style = "font-size: 20px;">Regards,</p>
        <p style = "font-size: 20px;">Dev Team</p>
      </main>
      </div>
    <div>
    `,
      };
      const saveOtp = await createOtp.save();

      const updateuser = await authModel.findByIdAndUpdate(saveUser._id, {
        otpEmail: saveOtp._id,
      });
      await updateuser.save();
      await sendEmails(
        saveUser.handlerEmail,
        emailData.subject,
        emailData.html
      );

      const formattedOTP = Number(OTP);
      console.log();
      return res.status(200).json({
        success: true,
        message: "code sent successfully",
        data: OTP,
      });
    }

    if (handlerEmail) {
      const existingUser = await authModel
        .findOne({ handlerEmail: handlerEmail })
        .populate("profile");

      if (existingUser) {
        // login functionality

        const OTP = randomInt(100000, 999999);

        //create otp document

        const createOtp = new otpModel({
          auth: existingUser._id,
          otpKey: OTP,
          otpUsed: false,
          otpType: "Email",
          reason: "SignIn",
        });

        const saveOtp = await createOtp.save();

        const emailData = {
          subject: "Healing Paws - Account Login",
          html: `
                <div
                  style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
                >
                  <div style="z-index:1; position: relative;">
                  <header style="padding-bottom: 20px">
                    <div class="logo" style="text-align:center;">
                    </div>
                  </header>
                  <main
                    style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
                  >
                    <h1
                      style="color: #fd6835; font-size: 30px; font-weight: 700;"
                    >Welcome To Healing Paws</h1>
                    <p
                      style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
                    >Hi,</p>
                    <p
                      style="font-size: 20px; text-align: left; font-weight: 500;"
                    >Thank you for Login with us. Please use the following OTP to verify your email address.</p>
                    <h2
                      style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #fd6835; text-align: center; margin-top: 20px; margin-bottom: 20px;"
                    >${OTP}</h2>
                    <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
                    style = "color: #a87628; text-decoration: none; border-bottom: 1px solid #a87628;" href = "#"
                    >let us know.</a></p>
                    <p style = "font-size: 20px;">Regards,</p>
                    <p style = "font-size: 20px;">Dev Team</p>
                  </main>
                  </div>
                <div>
                `,
        };

        const updateOtp = await authModel.findByIdAndUpdate(existingUser._id, {
          otpEmail: saveOtp._id,
        });

        await updateOtp.save();

        sendEmails(
          existingUser.handlerEmail,
          emailData.subject,
          emailData.html
        );

        return res.status(200).json({
          success: true,
          message: "code sent successfully",
          data: OTP,
        });
      }
      if (!deviceType) {
        return res.status(400).json({
          success: false,
          message: "device type is not provide",
        });
      }

      if (!deviceToken) {
        return res.status(400).json({
          success: false,
          message: "device token is not provide",
        });
      }
      // Check if userEmail is provided and validate its format
      if (
        handlerEmail &&
        !handlerEmail.match(
          /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
        )
      ) {
        return res.status(500).json({
          success: false,
          message: "Invalid email format",
        });
      }

      //create user

      const createUser = new authModel({
        handlerEmail,
        userType,
        deviceType,
        deviceToken,
      });

      const saveUser = await createUser.save();

      const user = await new handlerModel({
        auth: saveUser._id,
        handlerLocation: {
          type: "Point",
          coordinates: [0, 0], // Default coordinates, replace with actual values if available
        },
      }).save();

      await authModel.findByIdAndUpdate(saveUser._id, { profile: user._id });

      if (!saveUser) {
        return res.status(400).json({
          success: false,
          message: "user not save",
        });
      }

      const OTP = randomInt(100000, 999999);

      //create otp document

      const createOtp = new otpModel({
        auth: saveUser._id,
        otpKey: OTP,
        otpUsed: false,
        otpType: "Email",
        reason: "SignUp",
      });

      const emailData = {
        subject: "Healing Paws - Account Verification",
        html: `
        <div
          style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
        >
          <div style="z-index:1; position: relative;">
          <header style="padding-bottom: 20px">
            <div class="logo" style="text-align:center;">
            </div>
          </header>
          <main
            style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
          >
            <h1
              style="color: #fd6835; font-size: 30px; font-weight: 700;"
            >Welcome To Healing Paws</h1>
            <p
              style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
            >Hi,</p>
            <p
              style="font-size: 20px; text-align: left; font-weight: 500;"
            >Thank you for registering with us. Please use the following OTP to verify your email address.</p>
            <h2
              style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #fd6835; text-align: center; margin-top: 20px; margin-bottom: 20px;"
            >${OTP}</h2>
            <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
            style = "color: #a87628; text-decoration: none; border-bottom: 1px solid #a87628;" href = "#"
            >let us know.</a></p>
            <p style = "font-size: 20px;">Regards,</p>
            <p style = "font-size: 20px;">Dev Team</p>
          </main>
          </div>
        <div>
        `,
      };
      const saveOtp = await createOtp.save();

      const updateuser = await authModel.findByIdAndUpdate(saveUser._id, {
        otpEmail: saveOtp._id,
      });
      await updateuser.save();
      await sendEmails(
        saveUser.handlerEmail,
        emailData.subject,
        emailData.html
      );

      return res.status(200).json({
        success: true,
        message: "code sent successfully",
        data: OTP,
      });
    }

    if (handlerNumber) {
      const existingUser = await authModel
        .findOne({ handlerNumber: handlerNumber })
        .populate("profile");

      if (existingUser) {
        //login functionality

        // const OTP=randomInt(100000,999999);

        //create otp document

        const createOtp = new otpModel({
          auth: existingUser._id,
          otpNumber: otpNumber,
          otpUsed: false,
          otpType: "Number",
          reason: "SignIn",
        });

        const saveOtp = await createOtp.save();

        const updateOtp = await authModel.findByIdAndUpdate(existingUser._id, {
          otpNumber: saveOtp._id,
        });
        console.log(updateOtp);

        await updateOtp.save();

        // await SendSMS(
        //   handlerNumber, `User Verification Code: ${OTP}`
        //         );

        return res.status(200).json({
          success: true,
          message: "code sent successfully",
          data: otpNumber,
        });
      }
      if (!deviceType) {
        return res.status(400).json({
          success: false,
          message: "device type is not provide",
        });
      }

      if (!deviceToken) {
        return res.status(400).json({
          success: false,
          message: "device token is not provide",
        });
      }

      //create user

      const createUser = new authModel({
        handlerNumber,
        userType,
        deviceType,
        deviceToken,
      });

      const saveUser = await createUser.save();

      const user = await new handlerModel({
        auth: saveUser._id,
        handlerLocation: {
          type: "Point",
          coordinates: [0, 0], // Default coordinates, replace with actual values if available
        },
      }).save();

      await authModel.findByIdAndUpdate(saveUser._id, { profile: user._id });

      if (!saveUser) {
        return res.status(400).json({
          success: false,
          message: "user not save",
        });
      }

      // const OTP=randomInt(100000,999999);

      //create otp document

      const createOtp = new otpModel({
        auth: saveUser._id,
        otpNumber: otpNumber,
        otpUsed: false,
        otpType: "Number",
        reason: "SignUp",
      });

      const saveOtp = await createOtp.save();

      const updateuser = await authModel.findByIdAndUpdate(saveUser._id, {
        otpNumber: saveOtp._id,
      });
      await updateuser.save();

      // await SendSMS(
      //   handlerNumber, `User Verification Code: ${OTP}`
      //     );

      return res.status(200).json({
        success: true,
        message: "code sent successfully",
        data: otpNumber,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//handler verify otp

export const verifyOtpHandler = async (req, res) => {
  try {
    const { handlerEmail, handlerNumber, otp } = req.body;

    if (!handlerEmail && !handlerNumber) {
      return res.status(400).json({
        success: false,
        message: "userEmail or userPhone is not provided",
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "otp not provide",
      });
    }

    if (handlerEmail) {
      const user = await authModel
        .findOne({ handlerEmail: handlerEmail })
        .populate("otpEmail");

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "user not found",
        });
      }

      let populateFields = ["otpEmail"];
      let isCreatedProfile = false; // Default value

      if (user.profile) {
        populateFields.push("profile");
        isCreatedProfile = true;
      }

      const userWithPopulatedField = await authModel
        .findOne({ handlerEmail: handlerEmail })
        .populate(populateFields);

      const otpEmail = userWithPopulatedField[populateFields[0]]; // Fix here

      if (!otpEmail) {
        return res.status(400).json({
          success: false,
          message: "otp not found",
        });
      }

      if (otpEmail.otpUsed) {
        return res.status(400).json({
          success: false,
          message: "otp already used",
        });
      }

      if (otpEmail.otpKey != otp) {
        return res.status(400).json({
          success: false,
          message: "invalid otp",
        });
      }

      // OTP expires after 1h
      const currentTime = new Date();
      const OTPTime = otpEmail.createdAt;
      const diff = currentTime.getTime() - OTPTime.getTime();
      const minutes = Math.floor(diff / 1000 / 60);

      if (minutes > 60) {
        return res.status(400).json({
          success: false,
          message: "OTP expire",
        });
      }

      const token = jwt.sign({ user_id: user._id }, process.env.SECRET_KEY, {
        expiresIn: "1d",
      });
      user.userToken = token;
      // Update otpUsed field in otpModel
      const otps = await otpModel.findOne({ auth: user._id, otpUsed: false });
      console.log(otps);
      if (otps) {
        otps.otpUsed = true;
        await otps.save();
      } else {
        // Handle case when otpModel document is not found
        return res.status(400).json({
          success: false,
          message: "otpModel document not found",
        });
      }

      const updateuser = await authModel.findByIdAndUpdate(user._id, {
        otpVerified: true,
        [populateFields[0]]: null,
      });

      const profile = {
        ...userWithPopulatedField._doc,
        userToken: token,
        isCreatedProfile,
      };

      return res.status(200).json({
        success: true,
        message: "otp verified successfully",
        data: profile,
      });
    } else if (handlerNumber) {
      const user = await authModel
        .findOne({ handlerNumber: handlerNumber })
        .populate("otpNumber");

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "user not found",
        });
      }

      let populateFields = ["otpNumber"];

      if (user.profile) {
        populateFields.push("profile");
      }

      const userWithPopulatedField = await authModel
        .findOne({ handlerNumber: handlerNumber })
        .populate(populateFields);

      const otpNumber = userWithPopulatedField[populateFields[0]]; // Fix here

      if (!otpNumber) {
        return res.status(400).json({
          success: false,
          message: "otp not found",
        });
      }

      if (otpNumber.otpUsed) {
        return res.status(400).json({
          success: false,
          message: "otp already used",
        });
      }

      if (otpNumber.otpNumber != otp) {
        return res.status(400).json({
          success: false,
          message: "invalid otp",
        });
      }

      // OTP expires after 1h
      const currentTime = new Date();
      const OTPTime = otpNumber.createdAt;
      const diff = currentTime.getTime() - OTPTime.getTime();
      const minutes = Math.floor(diff / 1000 / 60);

      if (minutes > 60) {
        return res.status(400).json({
          success: false,
          message: "OTP expire",
        });
      }

      const token = jwt.sign({ user_id: user._id }, process.env.SECRET_KEY, {
        expiresIn: "1d",
      });
      user.userToken = token;
      // Update otpUsed field in otpModel
      const otps = await otpModel.findOne({ auth: user._id, otpUsed: false });
      console.log(otps);
      if (otps) {
        otps.otpUsed = true;
        await otps.save();
      } else {
        // Handle case when otpModel document is not found
        return res.status(400).json({
          success: false,
          message: "otpModel document not found",
        });
      }

      const updateuser = await authModel.findByIdAndUpdate(user._id, {
        otpVerified: true,
        [populateFields[0]]: null,
      });

      const profile = { ...userWithPopulatedField._doc, userToken: token };

      return res.status(200).json({
        success: true,
        message: "otp verified successfully",
        data: profile,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "email and phone number not correct",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//handler create profile

export const handlerCreateProfile = [
  handleMultiPartData.fields([
    { name: "handlerProfilePhoto" },
    { name: "handlerCoverPhoto" },
  ]),
  async (req, res) => {
    try {
      const { user_id } = req.user;
      const { files } = req;
      let profileImageLocation = "";
      let coverImageLocation = "";

      // Upload profile photo if provided
      if (files.handlerProfilePhoto) {
        const profilePhoto = files.handlerProfilePhoto[0];
        profileImageLocation = await uploadFileWithFolder(
          profilePhoto.originalname,
          "handlers",
          profilePhoto.buffer
        );
        console.log("Profile Photo Location:", profileImageLocation);
      }

      // Upload cover photo if provided
      if (files.handlerCoverPhoto) {
        const coverPhoto = files.handlerCoverPhoto[0];
        coverImageLocation = await uploadFileWithFolder(
          coverPhoto.originalname,
          "handlers",
          coverPhoto.buffer
        );
        console.log("Cover Photo Location:", coverImageLocation);
      }

      const profileCreated = await handlerModel.findOne({
        auth: user_id,
        isCreatedProfile: true,
      });

      if (profileCreated) {
        return res.status(400).json({
          success: false,
          message: "handler already created profile",
        });
      }

      const user = await authModel
        .findOne({ _id: user_id, userType: "handlers" })
        .populate("profile");

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "handler not found",
        });
      }

      // Destructure and validate the request body
      const {
        handlerName,
        handlerAddress,
        handlerCity,
        handlerState,
        aboutYou,
        handlerEmail,
        handlerNumber,
        latitude,
        longitude,
      } = req.body;

      console.log(req.body);

      const existEmailWithProfile = await authModel
        .findOne({
          $or: [{ userEmail: handlerEmail }, { handlerEmail: handlerEmail }],
          profile: { $exists: true },
        })
        .populate("profile");

      console.log(existEmailWithProfile, "existEmailWithProfile");

      // Check if the populated profile has isCreatedProfile set to true
      const profiles = existEmailWithProfile?.profile;
      if (profiles && profiles.isCreatedProfile === true) {
        console.log("called");
        return res.status(400).json({
          success: false,
          message: "Already created profile with provided email",
        });
      }

      // Validate required fields
      const requiredFields = [
        { field: handlerName, message: "Handler first name not provide" },
        { field: handlerAddress, message: "Handler last name not provide" },
        { field: handlerCity, message: "Handler date of birth not provide" },
        { field: handlerState, message: "Handler gender not provide" },
        { field: aboutYou, message: "Handler address not provide" },
        { field: handlerEmail, message: "Handler city not provide" },
        { field: latitude, message: "Latitude not provide" },
        { field: longitude, message: "Longitude not provide" },
      ];

      for (const fieldObj of requiredFields) {
        if (!fieldObj.field) {
          return res.status(400).json({
            success: false,
            message: fieldObj.message,
          });
        }
      }

      if (
        !handlerEmail.match(
          /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
        )
      ) {
        return res.status(500).json({
          success: false,
          message: "Invalid email format",
        });
      }

      const location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };

      // Check if both photos are provided
      // if (!profileImageLocation || !coverImageLocation) {
      //   return res
      //     .status(400)
      //     .send(
      //       "Both handlerProfilePhoto and handlerCoverPhoto images are required"
      //     );
      // }

      // Check if the profile already exists
      let profile = await handlerModel.findOne({ auth: user_id });

      if (profile) {
        console.log("profile found");
        // Update the existing profile
        profile.handlerName = handlerName;
        profile.handlerAddress = handlerAddress;
        profile.handlerCity = handlerCity;
        profile.handlerState = handlerState;
        profile.aboutYou = aboutYou;
        profile.handlerLocation = location;
        profile.handlerProfilePhoto = profileImageLocation;
        profile.handlerCoverPhoto = coverImageLocation;
        profile.isCreatedProfile = true;

        const updateProfile = await profile.save();

        // Update user email and number in authModel if provided
        const updatedAuthProfile = await authModel.findOneAndUpdate(
          { _id: user_id },
          {
            $set: {
              handlerEmail: handlerEmail ? handlerEmail : undefined, // Set to undefined if not provided
              handlerNumber: handlerNumber ? handlerNumber : undefined, // Set to undefined if not provided
              profile: updateProfile._id,
            },
          },
          { new: true }
        );

        if (!updatedAuthProfile) {
          return res.status(400).json({
            success: false,
            message: "Auth profile not updated",
          });
        }

        try {
          const account = await createConnectedAccount(handlerEmail);
          if (account) {
            updateProfile.handlerAccountId = account;
            await updateProfile.save();
          }

          const verifyAccountUrl = await verifyConnectedAccount(account);

          if (!verifyAccountUrl) {
            return res.status(400).json({
              success: false,
              message: "Account not verified",
            });
          }

          // Update auth profile
          const updatedAuthProfile = await authModel.findByIdAndUpdate(
            user_id,
            {
              $set: {
                handlerEmail,
                handlerNumber,
                profile: updateProfile._id,
              },
            },
            { new: true, runValidators: true }
          );

          if (!updatedAuthProfile) {
            return res.status(400).json({
              success: false,
              message: "Auth profile not updated",
            });
          }
          // Prepare profile response
          const profileResponse = {
            _id: updateProfile._id,
            auth: updateProfile.auth,
            handlerName: updateProfile.handlerName,
            handlerAddress: updateProfile.handlerAddress,
            handlerCity: updateProfile.handlerCity,
            handlerState: updateProfile.handlerState,
            aboutYou: updateProfile.aboutYou,
            handlerLocation: updateProfile.handlerLocation,
            isCreatedProfile: updateProfile.isCreatedProfile,
            handlerProfilePhoto: updateProfile.handlerProfilePhoto,
            handlerCoverPhoto: updateProfile.handlerCoverPhoto,
            handlerEmail: updatedAuthProfile.handlerEmail,
            handlerNumber: updatedAuthProfile.handlerNumber,
            verifyAccountUrl, // Include verifyAccountUrl in the profile object
          };

          return res.status(200).json({
            success: true,
            message: "Profile saved successfully",
            data: profileResponse,
          });
        } catch (error) {
          console.log(error.message);
          return res.status(500).json({
            success: false,
            message: "An error occurred: " + error.message,
          });
        }
      } else {
        console.log("profile not found");
        return res.status(400).json({
          success: false,
          message: "profile not found",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
];

//handler edit profile

export const handlerEditProfile = [
  handleMultiPartData.fields([
    {
      name: "handlerProfilePhoto",
    },
    {
      name: "handlerCoverPhoto",
    },
  ]),
  async (req, res) => {
    try {
      const { user_id } = req.user;
      const user = await authModel.findOne({
        _id: user_id,
        userType: "handlers",
      });
      let profileImageLocation = "";
      let coverImageLocation = "";
      const { files } = req;
      if (files.handlerProfilePhoto) {
        const file = files.handlerProfilePhoto[0];
        const fileName = file.originalname;
        const fileContent = file.buffer;

        profileImageLocation = await uploadFileWithFolder(
          fileName,
          "handlers",
          fileContent
        );
        console.log("Image Location:", profileImageLocation); // Log the resulting image location after upload
      }

      if (files.handlerCoverPhoto) {
        const file = files.handlerCoverPhoto[0];
        const fileName = file.originalname;
        const fileContent = file.buffer;

        coverImageLocation = await uploadFileWithFolder(
          fileName,
          "handlers",
          fileContent
        );
        console.log("Image Location:", coverImageLocation); // Log the resulting image location after upload
      }
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Handler not found",
        });
      }

      const {
        handlerName,
        handlerAddress,
        handlerCity,
        handlerState,
        latitude,
        longitude,
        aboutYou,
        handlerEmail,
        handlerNumber,
      } = req.body;

      const location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };

      const objectEditHandlerProfile = {
        handlerName,
        handlerAddress,
        handlerCity,
        handlerState,
        handlerLocation: location,
        aboutYou,
        handlerEmail,
        handlerNumber,
      };

      for (const key in objectEditHandlerProfile) {
        if (
          objectEditHandlerProfile[key] === "" ||
          objectEditHandlerProfile[key] === undefined
        ) {
          delete objectEditHandlerProfile[key];
        }
      }

      const objectEditAuthProfile = {
        handlerEmail: handlerEmail,
        handlerNumber: handlerNumber,
      };

      for (const key in objectEditAuthProfile) {
        if (
          objectEditAuthProfile[key] === "" ||
          objectEditAuthProfile[key] === undefined
        ) {
          delete objectEditAuthProfile[key];
        }
      }

      if (files && files.handlerProfilePhoto && files.handlerCoverPhoto) {
        objectEditHandlerProfile.handlerProfilePhoto = profileImageLocation;
        objectEditHandlerProfile.handlerCoverPhoto = coverImageLocation;
      }

      console.log(objectEditHandlerProfile);
      const editHandlerProfile = await handlerModel.findOneAndUpdate(
        { auth: user_id },
        objectEditHandlerProfile,
        { new: true }
      );

      if (!editHandlerProfile) {
        return res.status(400).json({
          success: false,
          message: "user profile not edit",
        });
      }

      const editAuthProfile = await authModel.findByIdAndUpdate(
        user_id,
        objectEditAuthProfile,
        { new: true }
      );

      if (!editAuthProfile) {
        return res.status(400).json({
          success: false,
          message: "auth profile not edit",
        });
      }

      const updateObj = {
        _id: editHandlerProfile._id,
        handlerLocation: editHandlerProfile.handlerLocation,
        auth: editHandlerProfile.auth,
        handlerName: editHandlerProfile.handlerName,
        handlerAddress: editHandlerProfile.handlerAddress,
        handlerState: editHandlerProfile.handlerState,
        handlerCity: editHandlerProfile.handlerCity,
        aboutYou: editHandlerProfile.aboutYou,
        userState: editHandlerProfile.userState,
        handlerEmail: editAuthProfile.handlerEmail,
        handlerNumber: editAuthProfile.handlerNumber,
      };

      // Conditionally add image properties to the response object
      if (files && files.handlerProfilePhoto && files.handlerCoverPhoto) {
        updateObj.handlerProfilePhoto = editHandlerProfile.handlerProfilePhoto;
        updateObj.handlerCoverPhoto = editHandlerProfile.handlerCoverPhoto;
      }

      return res.status(200).json({
        success: true,
        message: "profile edit successfully",
        data: updateObj,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
];

//get handler profile

export const getHandlerProfile = async (req, res) => {
  try {
    const { user_id } = req.user;
    const handler = await authModel.findOne({
      _id: user_id,
      userType: "handlers",
    });
    console.log(handler);
    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    const getProfile = await handlerModel
      .find({ auth: user_id })
      .populate(["auth", "serviceRating"])
      .lean();
    console.log(getProfile);
    if (!getProfile) {
      return res.status(400).json({
        success: false,
        message: "handler profile not found",
      });
    }

    getProfile.forEach((data) => {
      let totalRating = 0;
      let totalReview = 0;

      data.serviceRating.forEach((serviceData) => {
        totalRating += serviceData.serviceRating;
        totalReview++;
      });

      const overAllRating = totalReview > 0 ? totalRating / totalReview : 0;

      data.overAllRating = overAllRating;
    });
    return res.status(200).json({
      success: true,
      message: "handler profile found successfully",
      data: getProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//add business bank account

export const addBusinessBankAccount = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { accountNumber, routingNumber } = req.body;
    const handler = await authModel
      .findOne({ _id: user_id, userType: "handlers" })
      .populate("profile");
    console.log(handler);
    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    const externalAccount = await createExternalBankAccount({
      account_id: handler.profile.handlerAccountId,
      account_number: accountNumber,
      routing_number: routingNumber,
    });

    if (!externalAccount) {
      return res.status(400).json({
        success: false,
        message: "external account not create",
      });
    }

    return res.status(200).json({
      success: true,
      message: "external account create successfully",
      data: externalAccount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get business bank account

export const getBusinessBankAccount = async (req, res) => {
  try {
    const { user_id } = req.user;
    const handler = await authModel
      .findOne({ _id: user_id, userType: "handlers" })
      .populate("profile");
    console.log(handler);
    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    const accountId = handler.profile.handlerAccountId;
    console.log(accountId);
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Handler account ID is missing",
      });
    }

    const externalAccount = await getAllBankDetail(accountId);

    console.log(externalAccount, "externalaccount");

    const verifyAccountUrl = await verifyConnectedAccount(accountId);

    if (!verifyAccountUrl) {
      return res.status(400).json({
        success: false,
        message: "Account not verified",
      });
    }

    if (externalAccount.data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "bussiness account not found add please account first",
        data: verifyAccountUrl,
      });
    }

    return res.status(200).json({
      success: true,
      message: "bussiness account found successfully",
      data: externalAccount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const handlerDeleteAccount = async (req, res) => {
  try {
    const { user_id } = req.user;
    const handler = await authModel
      .findOne({ _id: user_id, userType: "handlers" })
      .populate("profile");
    console.log(handler);
    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    const deleteaccount = await authModel.findByIdAndDelete(user_id);

    const deleteprofile = await handlerModel.findByIdAndDelete(
      handler.profile._id
    );

    if (!deleteaccount || !deleteprofile) {
      return res.status(400).json({
        success: false,
        message: "account not delete",
      });
    }

    return res.status(200).json({
      success: true,
      message: "account delete successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// handler social login

export const handlerSocialLogin = async (req, res) => {
  try {
    console.log("handler social login");
    const { socialType, accessToken, deviceType, deviceToken, handlerEmail } =
      req.body;

    // Validate required parameters
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "provide access token",
      });
    }

    if (!deviceType) {
      return res.status(400).json({
        success: false,
        message: "provide device type",
      });
    }

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        message: "provide device token",
      });
    }

    let existingUser = await authModel
      .findOne({ accessToken: accessToken })
      .populate("profile");

    if (!existingUser) {
      const newRecord = await new authModel({
        handlerEmail,
        deviceToken,
        deviceType,
        socialType,
        accessToken,
        userType: "handlers",
      }).save();

      const user = await new handlerModel({
        auth: newRecord._id,
        handlerLocation: {
          type: "Point",
          coordinates: [0, 0], // Default coordinates, replace with actual values if available
        },
      }).save();

      await authModel.findByIdAndUpdate(newRecord._id, { profile: user._id });

      const updatedRecord = await authModel
        .findById(newRecord._id)
        .populate("profile");
      const secondsInYear = 365.25 * 24 * 60 * 60; // 1 year in seconds
      const token = jwt.sign(
        { user_id: newRecord._id },
        process.env.SECRET_KEY,
        {
          expiresIn: secondsInYear,
        }
      );

      const profile = {
        ...updatedRecord._doc,
        // isCreatedProfile: user.isCreatedProfile,
        userToken: token,
      };
      return res.status(200).json({
        success: true,
        message: "User profile created and logged in successfully",
        data: profile,
      });
    } else {
      console.log("login");
      // If the user already exists, update the user's information and provide a token
      const secondsInYear = 365.25 * 24 * 60 * 60; // 1 year in seconds
      const token = jwt.sign(
        { user_id: existingUser._id },
        process.env.SECRET_KEY,
        { expiresIn: secondsInYear }
      );

      const updatedUser = await authModel
        .findByIdAndUpdate(
          existingUser._id,
          {
            deviceToken,
            deviceType,
            socialType,
            accessToken,
          },
          { new: true }
        )
        .populate("profile");
      console.log(updatedUser, "updatedUser");

      const profile = {
        ...updatedUser._doc,
        isCreatedProfile: updatedUser.profile.isCreatedProfile,
        userToken: token,
      };
      return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        data: profile,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verificationBusinessAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const htmlContent = {
      subject: "Healing Paws - Business Account Verification",
      html: `
      <div
        style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
      >
        <div style="z-index:1; position: relative;">
        <header style="padding-bottom: 20px">
          <div class="logo" style="text-align:center;">
          </div>
        </header>
        <main
          style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
        >
          <h1
            style="color: #fd6835; font-size: 30px; font-weight: 700;"
          >Welcome To Healing Paws</h1>
          <p
            style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
          >Hi,</p>
          <p
            style="font-size: 20px; text-align: left; font-weight: 500;"
          >Thank you for Verification with Stripe</p>
          <h2
            style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #fd6835; text-align: center; margin-top: 20px; margin-bottom: 20px;"
          >Your Business Account Verification Successfully</h2>
          <p style = "font-size: 20px;">Regards,</p>
          <p style = "font-size: 20px;">Dev Team</p>
        </main>
        </div>
      <div>
      `,
    };
    // Set Content-Type header to text/html
    res.setHeader("Content-Type", "text/html");
    // Send the HTML content
    res.send(htmlContent.html);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//resend otp

export const resendOtpHandler = async (req, res) => {
  try {
    const { handlerEmail, handlerNumber, otpNumber } = req.body;

    if (!handlerEmail && !handlerNumber) {
      return res.status(400).json({
        success: false,
        message: "handler email or number not provide",
      });
    }
    if (handlerEmail) {
      const user = await authModel.findOne({ handlerEmail: handlerEmail });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "handler not found",
        });
      }

      const OTP = randomInt(100000, 999999);

      const otpDB = await otpModel.findOneAndUpdate(
        {
          auth: user._id,
        },
        {
          $setOnInsert: {
            auth: user._id,
          },
          $set: {
            otpKey: OTP,
            expireAt: new Date(new Date().getTime() + 60 * 60 * 1000),
            otpUsed: false,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      const emailData = {
        subject: "Healing Paws - Resend Otp",
        html: `
              <div
                style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
              >
                <div style="z-index:1; position: relative;">
                <header style="padding-bottom: 20px">
                  <div class="logo" style="text-align:center;">
                  </div>
                </header>
                <main
                  style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
                >
                  <h1
                    style="color: #fd6835; font-size: 30px; font-weight: 700;"
                  >Welcome To Healing Paws</h1>
                  <p
                    style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
                  >Hi,</p>
                  <p
                    style="font-size: 20px; text-align: left; font-weight: 500;"
                  >Thank you for Login with us. Please use the following OTP to verify your email address.</p>
                  <h2
                    style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #fd6835; text-align: center; margin-top: 20px; margin-bottom: 20px;"
                  >${OTP}</h2>
                  <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
                  style = "color: #a87628; text-decoration: none; border-bottom: 1px solid #a87628;" href = "#"
                  >let us know.</a></p>
                  <p style = "font-size: 20px;">Regards,</p>
                  <p style = "font-size: 20px;">Dev Team</p>
                </main>
                </div>
              <div>
              `,
      };
      const updateOtp = await authModel.findByIdAndUpdate(user._id, {
        otpEmail: otpDB._id,
      });

      await updateOtp.save();

      sendEmails(user.userEmail, emailData.subject, emailData.html);

      return res.status(200).json({
        success: true,
        message: "otp resend successfully",
        data: { OTP, isCreatedProfile: user.profile.isCreatedProfile },
      });
    }

    if (handlerNumber) {
      const user = await authModel.findOne({ handlerNumber: handlerNumber });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "user not found",
        });
      }
      const otpDB = await otpModel.findOneAndUpdate(
        {
          auth: user._id,
        },
        {
          $setOnInsert: {
            auth: user._id,
          },
          $set: {
            otpKey: otpNumber,
            expireAt: new Date(new Date().getTime() + 60 * 60 * 1000),
            otpUsed: false,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      const updateOtp = await authModel.findByIdAndUpdate(user._id, {
        otpNumber: otpDB._id,
      });

      await updateOtp.save();

      const otp = Number(otpNumber);

      return res.status(200).json({
        success: true,
        message: "otp resend successfully",
        data: { OTP: otp, isCreatedProfile: user.profile.isCreatedProfile },
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

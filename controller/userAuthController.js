import otpModel from "../model/otpModel.js";
import userModel from "../model/userModel.js";
import { randomInt } from "crypto";
import { sendEmails } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import { handleMultiPartData } from "../utils/mutliPartData.js";
import authModel from "../model/authModel.js";
import stripe from "stripe";
import { createCustomer } from "../utils/stripeApis.js";
import { uploadFileWithFolder } from "../utils/awsFileUpload.js";
import userWalletModel from "../model/userWalletModel.js";
const stripeInstance = stripe(process.env.STRIPE_KEY);

//user SignUp

export const userSignIn = async (req, res) => {
  try {
    const {
      userEmail,
      userNumber,
      userType,
      deviceType,
      deviceToken,
      otpNumber,
    } = req.body;

    const staticEmail = "aaron.miles@theapptitude.com";

    // Check if userEmail is provided and validate its format
    if (
      userEmail &&
      !userEmail.match(
        /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
      )
    ) {
      return res.status(500).json({
        success: false,
        message: "Invalid email format",
      });
    }
    if (
      staticEmail &&
      !staticEmail.match(
        /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
      )
    ) {
      return res.status(500).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (!userEmail && !userNumber) {
      return res.status(400).json({
        success: false,
        message: "Email or Number is not provided",
      });
    }

    if (userEmail === staticEmail) {
      const existingUser = await authModel
        .findOne({ userEmail: staticEmail })
        .populate("profile");

      if (existingUser) {
        // login functionality

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

        sendEmails(existingUser.userEmail, emailData.subject, emailData.html);

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
        userEmail,
        userType,
        deviceType,
        deviceToken,
      });

      const saveUser = await createUser.save();

      const user = await new userModel({
        auth: saveUser._id,
        userLocation: {
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
      await sendEmails(saveUser.userEmail, emailData.subject, emailData.html);

      const formattedOTP = Number(OTP);
      console.log();
      return res.status(200).json({
        success: true,
        message: "code sent successfully",
        data: OTP,
      });
    }

    if (userEmail) {
      const existingUser = await authModel
        .findOne({ userEmail: userEmail })
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

        sendEmails(existingUser.userEmail, emailData.subject, emailData.html);

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
      if (
        !userEmail.match(
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
        userEmail,
        userType,
        deviceType,
        deviceToken,
      });

      const saveUser = await createUser.save();

      const user = await new userModel({
        auth: saveUser._id,
        userLocation: {
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
      await sendEmails(saveUser.userEmail, emailData.subject, emailData.html);

      return res.status(200).json({
        success: true,
        message: "code sent successfully",
        data: OTP,
      });
    }

    if (userNumber) {
      console.log("number called");
      const existingUser = await authModel
        .findOne({ userNumber: userNumber })
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
        //   userNumber, `User Verification Code: ${OTP}`
        //         );

        //         console.log(SendSMS);

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
        userNumber,
        userType,
        deviceType,
        deviceToken,
      });

      const saveUser = await createUser.save();

      const user = await new userModel({
        auth: saveUser._id,
        userLocation: {
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
        // otpKey:OTP,
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
      //   userNumber, `User Verification Code: ${OTP}`
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

//verify Otp user

export const verifyOtpUser = async (req, res) => {
  try {
    const { userEmail, userNumber, otp } = req.body;

    if (!userEmail && !userNumber) {
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

    if (userEmail) {
      const user = await authModel
        .findOne({ userEmail: userEmail })
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
        .findOne({ userEmail: userEmail })
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
    } else if (userNumber) {
      console.log("user number====>");
      const user = await authModel
        .findOne({ userNumber: userNumber })
        .populate("otpNumber");

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "user not found",
        });
      }

      let populateFields = ["otpNumber"];

      let isCreatedProfile = false;
      if (user.profile) {
        populateFields.push("profile");
        isCreatedProfile = true;
      }

      const userWithPopulatedField = await authModel
        .findOne({ userNumber: userNumber })
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

//user create profile

export const userCreateProfile = [
  // handleMultiPartData.single("userProfileImage"),
  handleMultiPartData.fields([
    {
      name: "userProfileImage",
      maxCount: 1,
    },
  ]),
  async (req, res) => {
    try {
      const { user_id } = req.user;
      const { files } = req;
      console.log(files);
      let imageLocation = "";

      if (files.userProfileImage) {
        const file = files.userProfileImage[0];
        const fileName = file.originalname;
        const fileContent = file.buffer;

        imageLocation = await uploadFileWithFolder(
          fileName,
          "users",
          fileContent
        );
        console.log("Image Location:", imageLocation); // Log the resulting image location after upload
      }

      // console.log(files);
      const user = await authModel
        .findOne({ _id: user_id, userType: "users" })
        .populate("profile");

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
      // Extract userDateOfBirth and userGender from req.body
      const userDateOfBirth = req.body.userDateOfBirth || "0";
      const userGender = req.body.userGender || "Not Defined";

      const {
        userFirstName,
        userLastName,
        // userDateOfBirth,
        // userGender,
        userAddress,
        userCity,
        userState,
        userEmail,
        userNumber,
        latitude,
        longitude,
      } = req.body;

      const profileCreated = await userModel.findOne({
        auth: user_id,
        isCreatedProfile: true,
      });

      if (profileCreated) {
        return res.status(400).json({
          success: false,
          message: "user already created profile",
        });
      }

      if (
        !userEmail.match(
          /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
        )
      ) {
        return res.status(500).json({
          success: false,
          message: "Invalid email format",
        });
      }

      // Validate required fields
      const requiredFields = [
        { field: userFirstName, message: "User first name not provide" },
        { field: userLastName, message: "User last name not provide" },
        { field: userAddress, message: "User address not provide" },
        { field: userCity, message: "User city not provide" },
        { field: userState, message: "User state not provide" },
        { field: userEmail, message: "User email not provide" },
        { field: userNumber, message: "User number not provide" },
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

      // const existEmailWithProfile=await authModel.findOne({userEmail:userEmail,profile: { $exists: true }});
      const existEmailWithProfile = await authModel
        .findOne({
          $or: [{ userEmail: userEmail }, { handlerEmail: userEmail }],
          profile: { $exists: true },
        })
        .populate("profile");

      console.log(existEmailWithProfile, "existEmailWithProfile");

      // Check if the populated profile has isCreatedProfile set to true
      const profile = existEmailWithProfile?.profile;
      if (profile && profile.isCreatedProfile === true) {
        console.log("called");
        return res.status(400).json({
          success: false,
          message: "Already created profile with provided email",
        });
      }

      console.log(existEmailWithProfile, "existEmailWithProfile");
      console.log(profileCreated, "profileCreated");

      // Validation for user data...

      const location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };

      console.log("userid", user._id);

      try {
        const existingProfile = await userModel.findOne({ auth: user_id });

        if (existingProfile) {
          console.log("profile found");
          // If the profile exists, update it
          existingProfile.userFirstName = userFirstName;
          existingProfile.userLastName = userLastName;
          existingProfile.userDateOfBirth = userDateOfBirth;
          existingProfile.userGender = userGender;
          existingProfile.userLocation = location;
          existingProfile.userAddress = userAddress;
          existingProfile.userCity = userCity;
          existingProfile.userState = userState;
          existingProfile.userProfileImage = imageLocation;
          existingProfile.isCreatedProfile = true;

          const updatedProfile = await existingProfile.save();

          if (!updatedProfile) {
            return res.status(400).json({
              success: false,
              message: "User profile not updated",
            });
          }

          // Create user wallet if not exists
          const createuserWallet = new userWalletModel({
            authid: user_id,
          });
          const saveUserWallet = await createuserWallet.save();

          existingProfile.userWallet = saveUserWallet._id;
          await existingProfile.save();

          try {
            const customer = await createCustomer(userEmail);
            if (customer) {
              existingProfile.customerId = customer.id;
              await existingProfile.save();
            } else {
              console.log("Customer ID is null");
            }
          } catch (error) {
            console.log("Error creating Stripe customer:", error.message);
          }

          // Update user email and number in authModel if provided
          const updatedAuthProfile = await authModel.findOneAndUpdate(
            { _id: user_id },
            {
              $set: {
                userEmail: userEmail ? userEmail : undefined, // Set to undefined if not provided
                userNumber: userNumber ? userNumber : undefined, // Set to undefined if not provided
                profile: updatedProfile._id,
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

          const profile = {
            _id: updatedProfile._id,
            profile: updatedProfile.profile,
            auth: updatedProfile.auth,
            userFirstName: updatedProfile.userFirstName,
            userLastName: updatedProfile.userLastName,
            userDateOfBirth: updatedProfile.userDateOfBirth,
            userGender: updatedProfile.userGender,
            userLocation: updatedProfile.userLocation,
            userAddress: updatedProfile.userAddress,
            userCity: updatedProfile.userCity,
            userState: updatedProfile.userState,
            isCreatedProfile: updatedProfile.isCreatedProfile,
            userProfileImage: updatedProfile.userProfileImage,
            userEmail: updatedAuthProfile.userEmail,
            userNumber: updatedAuthProfile.userNumber,
            userWallet: saveUserWallet._id,
            customerId: existingProfile.customerId,
          };

          return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: profile,
          });
        } else {
          console.log("profile not found");

          return res.status(400).json({
            success: false,
            message: "profile not found",
          });
        }
      } catch (error) {
        console.error("Error saving user profile:", error);
        return res.status(500).json({
          success: false,
          message: error.message,
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

//user edit profile

export const editUserProfile = [
  // handleMultiPartData.single('userProfileImage'),
  handleMultiPartData.fields([
    {
      name: "userProfileImage",
      maxCount: 1,
    },
  ]),
  async (req, res) => {
    try {
      const { user_id } = req.user;
      console.log(user_id);
      let imageLocation = "";
      const { files } = req;

      if (files.userProfileImage) {
        const file = files.userProfileImage[0];
        const fileName = file.originalname;
        const fileContent = file.buffer;

        imageLocation = await uploadFileWithFolder(
          fileName,
          "users",
          fileContent
        );
        console.log("Image Location:", imageLocation); // Log the resulting image location after upload
      }
      const user = await authModel.findOne({ _id: user_id, userType: "users" });
      console.log(user);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "user not found",
        });
      }

      const {
        userFirstName,
        userLastName,
        userDateOfBirth,
        userGender,
        latitude,
        longitude,
        userAddress,
        userCity,
        userState,
        userEmail,
        userNumber,
      } = req.body;

      const location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };

      const objectEditUserProfile = {
        userFirstName,
        userLastName,
        userDateOfBirth,
        userGender,
        userLocation: location,
        userAddress,
        userCity,
        userState,
      };

      // if (!file) return res.status(400).send('No image in the request');

      // const baseUrl = `${req.protocol}://${req.get("host")}`;
      // const imagePath = file.path.replace(/\\/g, "/").replace("public/", "");

      // const fullImagePath = `${baseUrl}/${imagePath}`

      for (const key in objectEditUserProfile) {
        if (
          objectEditUserProfile[key] === "" ||
          objectEditUserProfile[key] === undefined
        ) {
          delete objectEditUserProfile[key];
        }
      }

      console.log(objectEditUserProfile);
      const objectEditAuthProfile = {
        userEmail: userEmail,
        userNumber: userNumber,
      };

      for (const key in objectEditAuthProfile) {
        if (
          objectEditAuthProfile[key] === "" ||
          objectEditAuthProfile[key] === undefined
        ) {
          delete objectEditAuthProfile[key];
        }
      }
      console.log(objectEditAuthProfile);

      if (files) {
        objectEditUserProfile.userProfileImage = imageLocation;
      }

      const editUserProfile = await userModel.findOneAndUpdate(
        { auth: user_id },
        objectEditUserProfile,
        { new: true }
      );

      console.log(editUserProfile);

      if (!editUserProfile) {
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
        _id: editUserProfile._id,
        userLocation: editUserProfile.userLocation,
        auth: editUserProfile.auth,
        userFirstName: editUserProfile.userFirstName,
        userLastName: editUserProfile.userLastName,
        userDateOfBirth: editUserProfile.userDateOfBirth,
        userGender: editUserProfile.userGender,
        userAddress: editUserProfile.userAddress,
        userCity: editUserProfile.userCity,
        userState: editUserProfile.userState,
        isCreatedProfile: editUserProfile.isCreatedProfile,
        userProfileImage: editUserProfile.userProfileImage,
        userEmail: editAuthProfile.userEmail,
        userNumber: editAuthProfile.userNumber,
      };

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

//get user profile

export const getUserProfile = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await authModel.findOne({ _id: user_id, userType: "users" });
    console.log(user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const getProfile = await userModel.find({ auth: user_id }).populate("auth");

    if (!getProfile) {
      return res.status(400).json({
        success: false,
        message: "user profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "user profile found successfully",
      data: getProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//user delete account

export const userDeleteAccount = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await authModel
      .findOne({ _id: user_id, userType: "users" })
      .populate("profile");
    console.log(user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const deleteaccount = await authModel.findByIdAndDelete(user_id);

    const deleteprofile = await userModel.findByIdAndDelete(user.profile._id);

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

//user social login

export const userSocialLogin = async (req, res) => {
  try {
    const { socialType, accessToken, deviceType, deviceToken, userEmail } =
      req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Provide access token",
      });
    }

    if (!deviceType) {
      return res.status(400).json({
        success: false,
        message: "Provide device type",
      });
    }

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        message: "Provide device token",
      });
    }

    let existingUser = await authModel
      .findOne({ accessToken: accessToken })
      .populate("profile");

    // If the user does not exist, create a new profile
    if (!existingUser) {
      const newRecord = await new authModel({
        userEmail,
        deviceToken,
        deviceType,
        socialType,
        accessToken,
        userType: "users",
      }).save();

      const user = await new userModel({
        auth: newRecord._id,
        userLocation: {
          type: "Point",
          coordinates: [0, 0], // Default coordinates, replace with actual values if available
        },
      }).save();

      const updatedata = await authModel.findByIdAndUpdate(newRecord._id, {
        profile: user._id,
      });

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
        userToken: token,
      };
      return res.status(200).json({
        success: true,
        message: "User profile created and logged in successfully",
        data: profile,
      });
    } else {
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
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//resend otp

export const resendOtpUser = async (req, res) => {
  try {
    const { userEmail, userNumber, otpNumber } = req.body;

    if (!userEmail && !userNumber) {
      return res.status(400).json({
        success: false,
        message: "user email or number not provide",
      });
    }
    if (userEmail) {
      const user = await authModel
        .findOne({ userEmail: userEmail })
        .populate("profile");
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "user not found",
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

    if (userNumber) {
      const user = await authModel
        .findOne({ userNumber: userNumber })
        .populate("profile");
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

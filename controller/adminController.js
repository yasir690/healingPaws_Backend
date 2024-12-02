import jwt from "jsonwebtoken";
import termsAndConditionModel from "../model/TermsAndConditionModel.js";
import aboutAppModel from "../model/aboutAppModel.js";
import adminModel from "../model/adminModel.js";
import authModel from "../model/authModel.js";
import feedBackModel from "../model/feedBackModel.js";
import privacyModel from "../model/privacyPolicyModel.js";
import refundModel from "../model/refundPolicyModel.js";
import bcrypt from "bcryptjs";
import userModel from "../model/userModel.js";
import handlerModel from "../model/handlerModel.js";
import pushNotification from "../middleware/pushNotification.js";
import userNotificationModel from "../model/userNotificationModel.js";
import paymentModel from "../model/paymentModel.js";
import refundRequestModel from "../model/refundRequestModel.js";
import userWalletModel from "../model/userWalletModel.js";

//register admin

export const adminRegister = async (req, res) => {
  try {
    const { adminName, adminEmail, adminPassword, userType, deviceToken } =
      req.body;

    if (!adminName) {
      return res.status(400).json({
        success: false,
        message: "admin name not provide",
      });
    }

    if (!adminEmail) {
      return res.status(400).json({
        success: false,
        message: "admin email not provide",
      });
    }
    if (!adminPassword) {
      return res.status(400).json({
        success: false,
        message: "admin password not provide",
      });
    }
    if (!userType) {
      return res.status(400).json({
        success: false,
        message: "user type not provide",
      });
    }
    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        message: "device token not provide",
      });
    }

    console.log(req.body);

    const auth = new authModel({
      adminEmail,
      adminPassword: await bcrypt.hashSync(adminPassword, 10),
      userType,
      deviceToken,
    });

    const saveauth = await auth.save();
    //create

    const register = new adminModel({
      auth: saveauth._id,
      adminName,
    });

    const saveAdmin = await register.save();

    const saveAdminPopulate = saveAdmin.populate("auth");
    if (!saveAdmin) {
      return res.status(400).json({
        success: false,
        message: "admin not save",
      });
    }

    const updatedAuthProfile = await authModel.findOneAndUpdate(
      { _id: auth._id },
      {
        $set: {
          profile: saveAdmin._id,
        },
      }
    );

    if (!updatedAuthProfile) {
      return res.status(400).json({
        success: false,
        message: "auth profile not update",
      });
    }

    try {
      const updatedAuthProfile = await authModel.findByIdAndUpdate(
        saveauth._id,
        {
          $set: {
            adminEmail: adminEmail ? adminEmail : undefined, // Set to undefined if not provided
            profile: saveAdmin._id,
          },
        },
        {
          new: true,
          runValidators: true, // Validate the updated fields against the model's schema
        }
      );

      if (!updatedAuthProfile) {
        return res.status(400).json({
          success: false,
          message: "Auth profile not updated",
        });
      }

      return res.status(200).json({
        success: true,
        message: "admin register successfully",
        data: saveAdmin,
      });
    } catch (error) {
      console.log(error.message);
      // Handle any errors that occurred during the try block
      return res.status(500).json({
        success: false,
        message: "An error occurred: " + error.message,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//admin login

export const adminLogin = async (req, res) => {
  try {
    const { adminEmail, adminPassword, deviceToken } = req.body;

    if (!adminEmail) {
      return res.status(400).json({
        success: false,
        message: "email not provide",
      });
    }

    if (!adminPassword) {
      return res.status(400).json({
        success: false,
        message: "password not provide",
      });
    }

    const admin = await authModel.findOne({ adminEmail: adminEmail });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    if (!bcrypt.compareSync(adminPassword, admin.adminPassword)) {
      loggerError.error("please enter correct password");
      return res.status(400).json({
        success: false,
        message: "Please Enter Correct Password",
      });
    }

    const token = jwt.sign({ user_id: admin._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    const response = {
      ...admin._doc,
      userToken: token,
    };

    if (deviceToken) {
      response.deviceToken = deviceToken;
      admin.deviceToken = deviceToken;
      await admin.save();
    }

    return res.status(200).json({
      success: true,
      message: "admin login successfully",
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//create terms and condition for user

export const createUserTermsAndCondition = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    console.log(admin);
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const { termsAndCondition } = req.body;

    const findusertermsandcondition = await termsAndConditionModel.find({
      Role: "users",
    });

    if (findusertermsandcondition.length > 0) {
      return res.status(400).json({
        success: false,
        message: "terms and condition create only once",
      });
    }

    //create

    const createtermsandcondtion = new termsAndConditionModel({
      termsAndCondition,
      createdBy: user_id,
      Role: "users",
    });

    const savetermsandcondtion = await createtermsandcondtion.save();

    if (!savetermsandcondtion) {
      return res.status(400).json({
        success: false,
        message: "terms and condition not save",
      });
    }

    return res.status(200).json({
      success: true,
      message: "terms and condition save successfully",
      data: savetermsandcondtion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get terms and condition for user

export const getUsersTermsAndCondition = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const getusertermsandcondition = await termsAndConditionModel.find({
      Role: "users",
    });

    if (!getusertermsandcondition) {
      return res.status(400).json({
        success: false,
        message: "terms and condition not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "terms and condition found successfully",
      data: getusertermsandcondition,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update terms and condition for user

export const updateUserTermsAndCondition = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const { termsAndCondition } = req.body;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }
    const findtermsandcondition = await termsAndConditionModel.findOne({
      _id: id,
      Role: "users",
    });

    if (!findtermsandcondition) {
      return res.status(400).json({
        success: false,
        message: "terms and condition not found",
      });
    }
    const updatetermsandcondition =
      await termsAndConditionModel.findByIdAndUpdate(
        id,
        {
          termsAndCondition,
        },
        {
          new: true,
        }
      );

    if (!updatetermsandcondition) {
      return res.status(400).json({
        success: false,
        message: "terms and condition not update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "terms and condition update successfully",
      data: updatetermsandcondition,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//create terms and condition for handler

export const createHandlerTermsAndCondition = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    console.log(admin);
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const { termsAndCondition } = req.body;

    const findusertermsandcondition = await termsAndConditionModel.find({
      Role: "handler",
    });

    if (findusertermsandcondition.length > 0) {
      return res.status(400).json({
        success: false,
        message: "terms and condition create only once",
      });
    }

    //create

    const createtermsandcondtion = new termsAndConditionModel({
      termsAndCondition,
      createdBy: user_id,
      Role: "handler",
    });

    const savetermsandcondtion = await createtermsandcondtion.save();

    if (!savetermsandcondtion) {
      return res.status(400).json({
        success: false,
        message: "terms and condition not save",
      });
    }

    return res.status(200).json({
      success: true,
      message: "terms and condition save successfully",
      data: savetermsandcondtion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get terms and condition for handler

export const getHandlersTermsAndCondition = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const getusertermsandcondition = await termsAndConditionModel.find({
      Role: "handler",
    });

    if (!getusertermsandcondition) {
      return res.status(400).json({
        success: false,
        message: "terms and condition not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "terms and condition found successfully",
      data: getusertermsandcondition,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update terms and condition for handler

export const updateHandlerTermsAndCondition = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const { termsAndCondition } = req.body;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }
    const findtermsandcondition = await termsAndConditionModel.findOne({
      _id: id,
      Role: "handler",
    });

    if (!findtermsandcondition) {
      return res.status(400).json({
        success: false,
        message: "terms and condition not found",
      });
    }
    const updatetermsandcondition =
      await termsAndConditionModel.findByIdAndUpdate(
        id,
        {
          termsAndCondition,
        },
        {
          new: true,
        }
      );

    if (!updatetermsandcondition) {
      return res.status(400).json({
        success: false,
        message: "terms and condition not update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "terms and condition update successfully",
      data: updatetermsandcondition,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//create privacy policy for user

export const createUserPrivacyPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const { privacyPolicy } = req.body;

    const findprivacyPolicy = await privacyModel.find({ Role: "users" });

    if (findprivacyPolicy.length > 0) {
      return res.status(400).json({
        success: false,
        message: "privacy policy create only once",
      });
    }

    //create

    const createPrivacy = new privacyModel({
      privacyPolicy,
      createdBy: user_id,
      Role: "users",
    });

    const savePrivacyPolicy = await createPrivacy.save();

    if (!savePrivacyPolicy) {
      return res.status(400).json({
        success: false,
        message: "privacy policy not save",
      });
    }

    return res.status(200).json({
      success: true,
      message: "privacy policy save successfully",
      data: savePrivacyPolicy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get privacy policy for user

export const getUsersPrivacyPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const getprivacy = await privacyModel.find({ Role: "users" });

    if (!getprivacy) {
      return res.status(400).json({
        success: false,
        message: "privacy policy not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "privacy policy found successfully",
      data: getprivacy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update privacy policy for user

export const updateUserPrivacyPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const { privacyPolicy } = req.body;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }
    const findprivacy = await privacyModel.findOne({ _id: id, Role: "users" });

    if (!findprivacy) {
      return res.status(400).json({
        success: false,
        message: "privacy policy not found",
      });
    }
    const updateprivacy = await privacyModel.findByIdAndUpdate(
      id,
      {
        privacyPolicy,
      },
      {
        new: true,
      }
    );

    if (!updateprivacy) {
      return res.status(400).json({
        success: false,
        message: "privacy policy not update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "privacy policy update successfully",
      data: updateprivacy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//create privacy policy for handler

export const createHandlerPrivacyPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const { privacyPolicy } = req.body;

    const findprivacyPolicy = await privacyModel.find({ Role: "handler" });

    if (findprivacyPolicy.length > 0) {
      return res.status(400).json({
        success: false,
        message: "privacy policy create only once",
      });
    }

    //create

    const createPrivacy = new privacyModel({
      privacyPolicy,
      createdBy: user_id,
      Role: "handler",
    });

    const savePrivacyPolicy = await createPrivacy.save();

    if (!savePrivacyPolicy) {
      return res.status(400).json({
        success: false,
        message: "privacy policy not save",
      });
    }

    return res.status(200).json({
      success: true,
      message: "privacy policy save successfully",
      data: savePrivacyPolicy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get privacy policy for handler

export const getHandlersPrivacyPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const getprivacy = await privacyModel.find({ Role: "handler" });

    if (!getprivacy) {
      return res.status(400).json({
        success: false,
        message: "privacy policy not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "privacy policy found successfully",
      data: getprivacy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update privacy policy for handler

export const updateHandlerPrivacyPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const { privacyPolicy } = req.body;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }
    const findprivacy = await privacyModel.findOne({
      _id: id,
      Role: "handler",
    });

    if (!findprivacy) {
      return res.status(400).json({
        success: false,
        message: "privacy policy not found",
      });
    }
    const updateprivacy = await privacyModel.findByIdAndUpdate(
      id,
      {
        privacyPolicy,
      },
      {
        new: true,
      }
    );

    if (!updateprivacy) {
      return res.status(400).json({
        success: false,
        message: "privacy policy not update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "privacy policy update successfully",
      data: updateprivacy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//create about app for user

export const createUserAboutApp = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const { aboutApp } = req.body;

    const findaboutapp = await aboutAppModel.find({ Role: "users" });

    if (findaboutapp.length > 0) {
      return res.status(400).json({
        success: false,
        message: "about app create only once",
      });
    }

    //create about app

    const createAboutApp = new aboutAppModel({
      aboutApp,
      createdBy: user_id,
      Role: "users",
    });

    const saveAboutApp = await createAboutApp.save();

    if (!saveAboutApp) {
      return res.status(400).json({
        success: false,
        message: "about app not save",
      });
    }

    return res.status(200).json({
      success: true,
      message: "about app save successfully",
      data: saveAboutApp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get about app for user

export const getUsersAboutApp = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const getaboutapp = await aboutAppModel.find({ Role: "users" });

    if (!getaboutapp) {
      return res.status(400).json({
        success: false,
        message: "about app not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "about app found successfully",
      data: getaboutapp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update about app for user

export const updateUserAboutApp = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const { aboutApp } = req.body;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }
    const findaboutapp = await aboutAppModel.findOne({
      _id: id,
      Role: "users",
    });

    if (!findaboutapp) {
      return res.status(400).json({
        success: false,
        message: "about app not found",
      });
    }
    const updateaboutapp = await aboutAppModel.findByIdAndUpdate(
      id,
      {
        aboutApp,
      },
      {
        new: true,
      }
    );

    if (!updateaboutapp) {
      return res.status(400).json({
        success: false,
        message: "about app not update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "about app update successfully",
      data: updateaboutapp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//create about app for handler

export const createHandlerAboutApp = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const { aboutApp } = req.body;

    const findaboutapp = await aboutAppModel.find({ Role: "handler" });

    if (findaboutapp.length > 0) {
      return res.status(400).json({
        success: false,
        message: "about app create only once",
      });
    }

    //create about app

    const createAboutApp = new aboutAppModel({
      aboutApp,
      createdBy: user_id,
      Role: "handler",
    });

    const saveAboutApp = await createAboutApp.save();

    if (!saveAboutApp) {
      return res.status(400).json({
        success: false,
        message: "about app not save",
      });
    }

    return res.status(200).json({
      success: true,
      message: "about app save successfully",
      data: saveAboutApp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get about app for handler

export const getHandlersAboutApp = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const getaboutapp = await aboutAppModel.find({ Role: "handler" });

    if (!getaboutapp) {
      return res.status(400).json({
        success: false,
        message: "about app not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "about app found successfully",
      data: getaboutapp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update about app for handler

export const updateHandlerAboutApp = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const { aboutApp } = req.body;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }
    const findaboutapp = await aboutAppModel.findOne({
      _id: id,
      Role: "handler",
    });

    if (!findaboutapp) {
      return res.status(400).json({
        success: false,
        message: "about app not found",
      });
    }
    const updateaboutapp = await aboutAppModel.findByIdAndUpdate(
      id,
      {
        aboutApp,
      },
      {
        new: true,
      }
    );

    if (!updateaboutapp) {
      return res.status(400).json({
        success: false,
        message: "about app not update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "about app update successfully",
      data: updateaboutapp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//create refund policy for user

export const createUserRefundPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const { refundPolicy } = req.body;

    const findrefundpolicy = await refundModel.find({ Role: "users" });

    if (findrefundpolicy.length > 0) {
      return res.status(400).json({
        success: false,
        message: "refund policy create only once",
      });
    }

    //create

    const createrefundpolicy = new refundModel({
      refundPolicy,
      createdBy: user_id,
      Role: "users",
    });

    const saverefundpolicy = await createrefundpolicy.save();

    if (!saverefundpolicy) {
      return res.status(400).json({
        success: false,
        message: "refund policy not save",
      });
    }

    return res.status(200).json({
      success: true,
      message: "refund policy save successfully",
      data: saverefundpolicy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUsersRefundPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;
    console.log(user_id);
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const getrefundpolicy = await refundModel.find({ Role: "users" });

    if (!getrefundpolicy) {
      return res.status(400).json({
        success: false,
        message: "refund request not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "refund request found successfully",
      data: getrefundpolicy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//get refund policy for user

export const getUserRefundRequest = async (req, res) => {
  try {
    const { user_id } = req.user;
    console.log(user_id);
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const getrefundpolicy = await refundRequestModel
      .find()

      .populate({
        path: "paymentId",
        model: "payment",
      })
      .populate({
        path: "authId",
        model: "auth",
        populate: {
          path: "profile",
          model: "users",
        },
      });

    console.log(getrefundpolicy, "getrefundpolicy");

    if (!getrefundpolicy) {
      return res.status(400).json({
        success: false,
        message: "refund request not found",
      });
    }

    const filteredRefundPolicy = getrefundpolicy.filter(
      (item) => item.paymentId.isRefunded === false
    );

    const updatedata = filteredRefundPolicy.map((item) => {
      const authId = item.authId.profile;
      const paymentId = item.paymentId;

      // console.log(handler,'handler');

      return {
        _id: item._id,
        refundReason: item.refundReason,
        description: item.description,
        userFirstName: authId.userFirstName,
        userLastName: authId.userLastName,
        userProfileImage: authId.userProfileImage,
        ...paymentId._doc,
      };
    });

    return res.status(200).json({
      success: true,
      message: "refund request found successfully",
      data: updatedata,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update refund policy for user

export const updateUserRefundPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const { refundPolicy } = req.body;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    if (!refundPolicy) {
      return res.status(400).json({
        success: false,
        message: "refund policy not provides",
      });
    }
    const findrefundpolicy = await refundModel.findOne({
      _id: id,
      Role: "users",
    });

    if (!findrefundpolicy) {
      return res.status(400).json({
        success: false,
        message: "refund policy not found",
      });
    }
    const updaterefundpolicy = await refundModel.findByIdAndUpdate(
      id,
      {
        refundPolicy,
      },
      {
        new: true,
      }
    );

    if (!updaterefundpolicy) {
      return res.status(400).json({
        success: false,
        message: "refund policy not update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "refund policy update successfully",
      data: updaterefundpolicy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//create refund policy for handler

export const createHandlerRefundPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const { refundPolicy } = req.body;

    const findrefundpolicy = await refundModel.find({ Role: "handler" });

    if (findrefundpolicy.length > 0) {
      return res.status(400).json({
        success: false,
        message: "refund policy create only once",
      });
    }

    //create

    const createrefundpolicy = new refundModel({
      refundPolicy,
      createdBy: user_id,
      Role: "handler",
    });

    const saverefundpolicy = await createrefundpolicy.save();

    if (!saverefundpolicy) {
      return res.status(400).json({
        success: false,
        message: "refund policy not save",
      });
    }

    return res.status(200).json({
      success: true,
      message: "refund policy save successfully",
      data: saverefundpolicy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get refund policy for handler

export const getHandlersRefundPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const getrefundpolicy = await refundModel.find({ Role: "handler" });

    if (!getrefundpolicy) {
      return res.status(400).json({
        success: false,
        message: "refund policy not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "refund policy found successfully",
      data: getrefundpolicy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update refund policy for handler

export const updateHandlerRefundPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const { refundPolicy } = req.body;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    if (!refundPolicy) {
      return res.status(400).json({
        success: false,
        message: "refund policy not provides",
      });
    }
    const findrefundpolicy = await refundModel.findOne({
      _id: id,
      Role: "handler",
    });

    if (!findrefundpolicy) {
      return res.status(400).json({
        success: false,
        message: "refund policy not found",
      });
    }
    const updaterefundpolicy = await refundModel.findByIdAndUpdate(
      id,
      {
        refundPolicy,
      },
      {
        new: true,
      }
    );

    if (!updaterefundpolicy) {
      return res.status(400).json({
        success: false,
        message: "refund policy not update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "refund policy update successfully",
      data: updaterefundpolicy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get feed back of user and handler

export const getUserAndHandlerFeedBack = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const getFeedBack = await feedBackModel.find().populate("createdBy");

    if (!getFeedBack || getFeedBack.length === 0) {
      return res.status(400).json({
        success: false,
        message: "feed back not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "feed back found successfully",
      data: getFeedBack,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//android and ios users

export const getAndroidAndIosUsers = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    //android users

    const androidUsers = await authModel.find({
      deviceType: "Android",
    });

    const iosUsers = await authModel.find({
      deviceType: "Ios",
    });

    console.log("androidUsers", androidUsers);

    console.log("iosUsers", iosUsers);

    if (!androidUsers || androidUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "android users not found",
        data: { iosUsers },
      });
    }

    if (!iosUsers || iosUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "ios users not found",
        data: { androidUsers },
      });
    }

    return res.status(200).json({
      success: true,
      message: "android and ios user found successfully",
      data: {
        androidUsers,
        iosUsers,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//total users

export const totalUsers = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const countUsers = await authModel.countDocuments({
      _id: { $ne: user_id },
    });

    if (!countUsers) {
      return res.status(400).json({
        success: false,
        message: "users not count",
      });
    }

    return res.status(200).json({
      success: true,
      message: "users count successfully",
      data: countUsers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all users

export const getAllUsers = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const findUsers = await userModel.find().populate("auth");

    if (!findUsers || findUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "users not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "users found successfully",
      data: findUsers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//delete user

export const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { userId } = req.params;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const finduser = await userModel.findById(userId);

    if (!finduser) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const deleteuser = await userModel.findByIdAndDelete(finduser._id);

    if (!deleteuser) {
      return res.status(400).json({
        success: false,
        message: "user not delete",
      });
    }
    return res.status(200).json({
      success: true,
      message: "user delete successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all handlers

export const getAllHandlers = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const findHandler = await handlerModel.find().populate("auth");

    if (!findHandler || findHandler.length === 0) {
      return res.status(400).json({
        success: false,
        message: "handlers not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "handlers found successfully",
      data: findHandler,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//delete handlers

export const deleteHandler = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { handlerId } = req.params;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const findhandler = await handlerModel.findById(handlerId);

    if (!findhandler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    const deletehandler = await handlerModel.findByIdAndDelete(findhandler._id);

    if (!deletehandler) {
      return res.status(400).json({
        success: false,
        message: "handler not delete",
      });
    }

    return res.status(200).json({
      success: true,
      message: "handler delete successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all new booking

export const getAllNewBooking = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const findAllBooking = await paymentModel
      .find({ isReceived: false })
      .populate([
        "userId",
        "handlerId",
        { path: "handlerId", populate: "pets" },
      ]);

    if (!findAllBooking || findAllBooking.length === 0) {
      return res.status(200).json({
        success: false,
        message: "booking not found",
      });
    }
    // const updatedata = findAllBooking.map((item) => {
    //     const userId=item.userId;
    //     const handler = item.handlerId;
    //     const booking = item.bookingId;
    //     console.log(handler);

    //     return {
    //         _id: item._id,
    //         handlerName:handler.handlerName,
    //         petName:handler.pets[0].petName,
    //         phoneNumber:userId.auth.userNumber,
    //         bookingId:booking._id,
    //         bookingDate: booking.bookingDate,
    //         selectedDate: booking.selectedDate,
    //         bookingStartTime: booking.bookingStartTime,
    //         bookingEndTime: booking.bookingEndTime,
    //         additional: booking.additional,
    //         petName: handler.pets[0].petName,
    //         petsImages: handler.pets[0].petsImages,
    //         Charges: item.Charges,
    //         totalTime: item.totalTime,
    //         TotalAmount: item.totalAmount,
    //         Tax:item.deductionFee,
    //         Subtotal:item.pay

    //     };
    // });
    return res.status(200).json({
      success: true,
      message: "booking found successfully",
      data: findAllBooking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all completed booking

export const getAllCompletedBooking = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const findAllBooking = await paymentModel
      .find({ isReceived: true })
      .populate([
        "userId",
        "handlerId",
        { path: "handlerId", populate: "pets" },
      ]);

    if (!findAllBooking || findAllBooking.length === 0) {
      return res.status(200).json({
        success: false,
        message: "booking not found",
      });
    }
    // const updatedata = findAllBooking.map((item) => {
    //     const userId=item.userId;
    //     const handler = item.handlerId;
    //     const booking = item.bookingId;
    //     console.log(handler);

    //     return {
    //         _id: item._id,
    //         handlerName:handler.handlerName,
    //         petName:handler.pets[0].petName,
    //         phoneNumber:userId.auth.userNumber,
    //         bookingId:booking._id,
    //         bookingDate: booking.bookingDate,
    //         selectedDate: booking.selectedDate,
    //         bookingStartTime: booking.bookingStartTime,
    //         bookingEndTime: booking.bookingEndTime,
    //         additional: booking.additional,
    //         petName: handler.pets[0].petName,
    //         petsImages: handler.pets[0].petsImages,
    //         Charges: item.Charges,
    //         totalTime: item.totalTime,
    //         TotalAmount: item.totalAmount,
    //         Tax:item.deductionFee,
    //         Subtotal:item.pay

    //     };
    // });
    return res.status(200).json({
      success: true,
      message: "booking found successfully",
      data: findAllBooking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all refund booking

export const getAllRefundBooking = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const getallrefundbooking = await paymentModel
      .find({ isRefunded: true })
      .populate([
        "userId",
        "handlerId",
        { path: "handlerId", populate: "pets" },
      ]);

    if (!getallrefundbooking || getallrefundbooking.length === 0) {
      return res.status(400).json({
        success: false,
        message: "refund booking not found",
      });
    }

    // const updatedata = findAllBooking.map((item) => {
    //     const userId=item.userId;
    //     const handler = item.handlerId;
    //     const booking = item.bookingId;
    //     console.log(handler);

    //     return {
    //         _id: item._id,
    //         handlerName:handler.handlerName,
    //         petName:handler.pets[0].petName,
    //         phoneNumber:userId.auth.userNumber,
    //         bookingId:booking._id,
    //         bookingDate: booking.bookingDate,
    //         selectedDate: booking.selectedDate,
    //         bookingStartTime: booking.bookingStartTime,
    //         bookingEndTime: booking.bookingEndTime,
    //         additional: booking.additional,
    //         petName: handler.pets[0].petName,
    //         petsImages: handler.pets[0].petsImages,
    //         Charges: item.Charges,
    //         totalTime: item.totalTime,
    //         TotalAmount: item.totalAmount,
    //         Tax:item.deductionFee,
    //         Subtotal:item.pay

    //     };
    // });

    return res.status(400).json({
      success: false,
      message: "refund booking found successfully",
      data: getallrefundbooking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//amount refund to user manualy

export const adminRefundToUser = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { amountRefund, bookingId } = req.body;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const findBooking = await paymentModel
      .findOne({ bookingId: bookingId, isRefunded: false })
      .populate(["bookingId", { path: "userId", populate: "auth" }]);

    if (!findBooking) {
      return res.status(400).json({
        success: false,
        message: "booking not found",
      });
    }
    console.log(findBooking);
    console.log(findBooking.userId.auth, "authid");

    findBooking.isRefunded = true;

    // return "hello"
    const userWallet = await userWalletModel.findOne({
      authid: findBooking.userId.auth,
    });

    if (!userWallet) {
      return res.status(400).json({
        success: false,
        message: "user wallet not found",
      });
    }

    console.log(findBooking.userId.userFirstName);
    // return "heh"
    userWallet.balance += amountRefund;
    userWallet.Refunds.push(findBooking._id);
    await userWallet.save();
    await findBooking.save();

    const notificationObj = {
      deviceToken: findBooking.userId.auth.deviceToken,
      title: "Refund Amount",
      body: `Refund Amount Send to ${findBooking.userId.userFirstName} from admin`,
      auth: findBooking.userId.auth,
    };

    const createNotification = new userNotificationModel(notificationObj);
    const save = createNotification.save();

    try {
      await pushNotification(notificationObj);
    } catch (error) {
      console.log(error.message);
    }
    return res.status(200).json({
      success: true,
      message: "refund amount send successfully",
      // data:userWallet
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deviceTokenSave = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { deviceToken } = req.body;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "admin not found",
      });
    }

    const updateadmin = await authModel.findByIdAndUpdate(
      user_id,
      {
        deviceToken: deviceToken,
      },
      { new: true }
    );

    if (!updateadmin) {
      return res.status(400).json({
        success: false,
        message: "device token not save",
      });
    }
    return res.status(200).json({
      success: true,
      message: "device token save successfully",
      data: updateadmin,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

import authModel from "../model/authModel.js";
import termsAndConditionModel from "../model/TermsAndConditionModel.js";
import privacyModel from "../model/privacyPolicyModel.js";
import aboutAppModel from "../model/aboutAppModel.js";
import refundModel from "../model/refundPolicyModel.js";

//get terms and condition for user

export const getUserTermsAndCondition = async (req, res) => {
  try {
    const { user_id } = req.user;

    const user = await authModel.findOne({
      _id: user_id,
      userType: "users",
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const getterms = await termsAndConditionModel.find({ Role: "users" });

    if (!getterms) {
      return res.status(400).json({
        success: false,
        message: "terms and condition not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "terms and condition found successfully",
      data: getterms,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get privacy policy for user

export const getUserPrivacyPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;

    const user = await authModel.findOne({
      _id: user_id,
      userType: "users",
    });

    if (!user) {
      return res.status(400).json({
        success: true,
        message: "user not found",
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
      success: false,
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

//get about app for user

export const getUserAboutApp = async (req, res) => {
  try {
    const { user_id } = req.user;

    const user = await authModel.findOne({
      _id: user_id,
      userType: "users",
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
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

//get refund policy for user

export const getUserRefundPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;

    const user = await authModel.findOne({
      _id: user_id,
      userType: "users",
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }
    const getrefundpolicy = await refundModel.find({ Role: "users" });

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

//get terms and condition for handler

export const getHandlerTermsAndCondition = async (req, res) => {
  try {
    const { user_id } = req.user;

    const handler = await authModel.findOne({
      _id: user_id,
      userType: "handlers",
    });

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
      });
    }

    const getterms = await termsAndConditionModel.find({ Role: "handler" });

    if (!getterms) {
      return res.status(400).json({
        success: false,
        message: "terms and condition not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "terms and condition found successfully",
      data: getterms,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get privacy policy for handler

export const getHandlerPrivacyPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;

    const handler = await authModel.findOne({
      _id: user_id,
      userType: "handlers",
    });

    if (!handler) {
      return res.status(400).json({
        success: true,
        message: "handler not found",
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
      success: false,
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

//get about app for handler

export const getHandlerAboutApp = async (req, res) => {
  try {
    const { user_id } = req.user;

    const handler = await authModel.findOne({
      _id: user_id,
      userType: "handlers",
    });

    if (!handler) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
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

//get refund policy for handler

export const getHandlerRefundPolicy = async (req, res) => {
  try {
    const { user_id } = req.user;

    const handlers = await authModel.findOne({
      _id: user_id,
      userType: "handlers",
    });

    if (!handlers) {
      return res.status(400).json({
        success: false,
        message: "handler not found",
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

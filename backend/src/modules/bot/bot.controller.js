import db from "../../database/models/index.js";
import crypto from "crypto";

const { Bot, Company } = db;

export const getBotConfig = async (req, res) => {
  try {
    const companyId = req.company?.id || req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        data: null,
      });
    }

    let bot = await Bot.findOne({ where: { companyId } });
    if (!bot) {
      const company = await Company?.findByPk(companyId);
      bot = await Bot.create({
        companyId,
        name: (company?.name || "AI") + " Bot",
      });
    }

    // Never send secret key in general config responses unless explicitly requested
    const botData = bot.toJSON();
    delete botData.secretKey;

    return res.status(200).json({
      success: true,
      message: "Bot configuration retrieved.",
      data: botData,
    });
  } catch (err) {
    console.error("Get Bot Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching bot config.",
      data: null,
    });
  }
};

export const updateBotConfig = async (req, res) => {
  try {
    const companyId = req.company?.id || req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        data: null,
      });
    }

    let bot = await Bot.findOne({ where: { companyId } });
    if (!bot) {
      bot = await Bot.create({ companyId });
    }

    const {
      name,
      theme,
      avatar,
      welcomeMessage,
      language,
      temperature,
      model,
      maxTokens,
      widgetPosition,
      allowedDomains,
    } = req.body;

    if (name !== undefined) bot.name = name;
    if (theme !== undefined) bot.theme = theme;
    if (avatar !== undefined) bot.avatar = avatar;
    if (welcomeMessage !== undefined) bot.welcomeMessage = welcomeMessage;
    if (language !== undefined) bot.language = language;
    if (temperature !== undefined) bot.temperature = temperature;
    if (model !== undefined) bot.model = model;
    if (maxTokens !== undefined) bot.maxTokens = maxTokens;
    if (widgetPosition !== undefined) bot.widgetPosition = widgetPosition;
    if (allowedDomains !== undefined) bot.allowedDomains = allowedDomains;

    await bot.save();

    const botData = bot.toJSON();
    delete botData.secretKey;

    return res.status(200).json({
      success: true,
      message: "Bot configuration updated successfully.",
      data: botData,
    });
  } catch (err) {
    console.error("Update Bot Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error updating bot config.",
      data: null,
    });
  }
};

export const rotateBotKeys = async (req, res) => {
  try {
    const companyId = req.company?.id || req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        data: null,
      });
    }

    let bot = await Bot.findOne({ where: { companyId } });
    if (!bot) {
      return res.status(404).json({
        success: false,
        message: "Bot configuration not found.",
        data: null,
      });
    }

    bot.publicKey = "pk_" + crypto.randomBytes(12).toString("hex");
    bot.secretKey = "sk_" + crypto.randomBytes(16).toString("hex");
    await bot.save();

    return res.status(200).json({
      success: true,
      message: "Bot API keys rotated successfully.",
      data: {
        publicKey: bot.publicKey,
      },
    });
  } catch (err) {
    console.error("Rotate Keys Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error rotating bot keys.",
      data: null,
    });
  }
};

export const getPublicWidgetConfig = async (req, res) => {
  try {
    const { botId, publicKey } = req.query;
    let bot = null;

    if (botId) {
      bot = await Bot.findByPk(botId);
    } else if (publicKey) {
      bot = await Bot.findOne({ where: { publicKey } });
    }

    if (!bot || !bot.isActive) {
      return res.status(404).json({
        success: false,
        message: "Bot not found or inactive.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Public widget config retrieved.",
      data: {
        botId: bot.id,
        name: bot.name,
        theme: bot.theme,
        avatar: bot.avatar,
        welcomeMessage: bot.welcomeMessage,
        widgetPosition: bot.widgetPosition,
      },
    });
  } catch (err) {
    console.error("Public Widget Config Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching widget config.",
      data: null,
    });
  }
};

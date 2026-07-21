import db from "../../database/models/index.js";

const { Webhook } = db;

export const getWebhooks = async (req, res) => {
  try {
    const webhooks = await Webhook.findAll({
      where: { companyId: req.company.id },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Webhooks retrieved.",
      data: webhooks,
    });
  } catch (err) {
    console.error("Get Webhooks Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching webhooks.",
      data: null,
    });
  }
};

export const createWebhook = async (req, res) => {
  try {
    const { url, events } = req.body;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Webhook target URL is required.",
        data: null,
      });
    }

    const webhook = await Webhook.create({
      companyId: req.company.id,
      url,
      events: events || ["chat.started", "chat.ended", "ticket.created", "human.handoff"],
    });

    return res.status(201).json({
      success: true,
      message: "Webhook endpoint registered.",
      data: webhook,
    });
  } catch (err) {
    console.error("Create Webhook Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error creating webhook.",
      data: null,
    });
  }
};

export const deleteWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Webhook.destroy({
      where: { id, companyId: req.company.id },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Webhook not found.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Webhook deleted successfully.",
      data: null,
    });
  } catch (err) {
    console.error("Delete Webhook Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error deleting webhook.",
      data: null,
    });
  }
};

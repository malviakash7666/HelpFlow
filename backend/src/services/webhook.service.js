import crypto from "crypto";
import axios from "axios";
import db from "../database/models/index.js";

const { Webhook } = db;

/**
 * Dispatch signed event webhooks to company listeners
 */
export const dispatchWebhook = async ({ companyId, event, payload }) => {
  if (!Webhook) return;

  try {
    const webhooks = await Webhook.findAll({
      where: {
        companyId,
        isActive: true,
      },
    });

    for (const webhook of webhooks) {
      const allowedEvents = Array.isArray(webhook.events)
        ? webhook.events
        : JSON.parse(webhook.events || "[]");

      if (allowedEvents.includes(event) || allowedEvents.includes("*")) {
        const body = JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        });

        // Compute HMAC SHA256 Signature
        const signature = crypto
          .createHmac("sha256", webhook.secret)
          .update(body)
          .digest("hex");

        // Send non-blocking HTTP POST request
        axios
          .post(webhook.url, body, {
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Signature": signature,
              "X-Webhook-Event": event,
            },
            timeout: 5000,
          })
          .catch((err) => {
            console.error(`[Webhook] Dispatch error for ${webhook.url}:`, err.message);
          });
      }
    }
  } catch (err) {
    console.error("[Webhook] Failed to dispatch webhooks:", err);
  }
};

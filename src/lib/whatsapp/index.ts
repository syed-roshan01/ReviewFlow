/**
 * WhatsApp Abstraction Layer
 *
 * Design goals:
 *  1. Single interface — swap providers without changing business logic
 *  2. MVP provider: WATI. Twilio ready. Meta Cloud API can be added.
 *  3. All sends are fire-and-forget from the caller's perspective;
 *     the provider logs the result to the whatsapp_messages table.
 */

import type { MessageType } from "@prisma/client";

// ─────────────────────────────────────────────
// Core interface every provider must implement
// ─────────────────────────────────────────────
export interface WhatsAppProvider {
  /**
   * Send a templated WhatsApp message.
   * Returns the provider-specific message ID.
   */
  sendTemplate(
    to: string,           // E.164 phone number
    templateName: string, // approved WhatsApp template name
    variables: string[]   // ordered template variable values
  ): Promise<{ messageId: string }>;
}

// ─────────────────────────────────────────────
// Message payload types
// ─────────────────────────────────────────────
export interface SendReviewRequestPayload {
  phone: string;
  customerName: string;
  businessName: string;
  reviewUrl: string;   // your /r/[slug] funnel URL
}

export interface SendReviewReminderPayload {
  phone: string;
  customerName: string;
  businessName: string;
  reviewUrl: string;
}

// ─────────────────────────────────────────────
// Template registry — centralises template names
// per provider. Register templates in your WA account.
// ─────────────────────────────────────────────
const TEMPLATES = {
  REVIEW_REQUEST: "review_request_v1",
  REVIEW_REMINDER: "review_reminder_v1",
  THANK_YOU: "thank_you_v1",
} as const;

// ─────────────────────────────────────────────
// Factory — reads WHATSAPP_PROVIDER env var
// ─────────────────────────────────────────────
export function getWhatsAppProvider(): WhatsAppProvider {
  const provider = process.env.WHATSAPP_PROVIDER ?? "none";

  switch (provider) {
    case "wati":
      return new WatiProvider();
    case "twilio":
      return new TwilioProvider();
    case "none":
    default:
      return new NoOpProvider();
  }
}

// ─────────────────────────────────────────────
// Business-logic helpers (provider-agnostic)
// ─────────────────────────────────────────────
export async function sendReviewRequest(
  payload: SendReviewRequestPayload
): Promise<{ messageId: string }> {
  const provider = getWhatsAppProvider();
  return provider.sendTemplate(payload.phone, TEMPLATES.REVIEW_REQUEST, [
    payload.customerName,
    payload.businessName,
    payload.reviewUrl,
  ]);
}

export async function sendReviewReminder(
  payload: SendReviewReminderPayload
): Promise<{ messageId: string }> {
  const provider = getWhatsAppProvider();
  return provider.sendTemplate(payload.phone, TEMPLATES.REVIEW_REMINDER, [
    payload.customerName,
    payload.businessName,
    payload.reviewUrl,
  ]);
}

export function messageTypeToTemplateName(type: MessageType): string {
  return TEMPLATES[type] ?? TEMPLATES.REVIEW_REQUEST;
}

// ─────────────────────────────────────────────
// WATI Provider
// https://docs.wati.io
// ─────────────────────────────────────────────
class WatiProvider implements WhatsAppProvider {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    this.baseUrl = process.env.WATI_API_URL ?? "";
    this.token = process.env.WATI_API_TOKEN ?? "";

    if (!this.baseUrl || !this.token) {
      throw new Error("WATI_API_URL and WATI_API_TOKEN must be set");
    }
  }

  async sendTemplate(
    to: string,
    templateName: string,
    variables: string[]
  ): Promise<{ messageId: string }> {
    // Strip leading '+' — WATI expects digits only
    const phone = to.replace(/^\+/, "");

    const body = {
      template_name: templateName,
      broadcast_name: `reviewflow_${templateName}_${Date.now()}`,
      parameters: variables.map((value, i) => ({
        name: `v${i + 1}`,
        value,
      })),
    };

    const res = await fetch(
      `${this.baseUrl}/api/v1/sendTemplateMessage?whatsappNumber=${phone}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WATI error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as { id?: string; messageId?: string };
    return { messageId: data.id ?? data.messageId ?? "unknown" };
  }
}

// ─────────────────────────────────────────────
// Twilio Provider (WhatsApp via Twilio)
// https://www.twilio.com/docs/whatsapp
// ─────────────────────────────────────────────
class TwilioProvider implements WhatsAppProvider {
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly from: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
    this.authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
    this.from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

    if (!this.accountSid || !this.authToken) {
      throw new Error("Twilio credentials must be set");
    }
  }

  async sendTemplate(
    to: string,
    templateName: string,
    variables: string[]
  ): Promise<{ messageId: string }> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

    // Twilio uses Content Templates — build body from variables for MVP
    const body = variables.join(" | ");

    const params = new URLSearchParams({
      From: this.from,
      To: `whatsapp:${to}`,
      Body: body,
      // ContentSid: "HXxxx" — use this for approved templates
    });

    const credentials = Buffer.from(
      `${this.accountSid}:${this.authToken}`
    ).toString("base64");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Twilio error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as { sid?: string };
    return { messageId: data.sid ?? "unknown" };
  }
}

// ─────────────────────────────────────────────
// NoOp Provider — logs to console (development)
// ─────────────────────────────────────────────
class NoOpProvider implements WhatsAppProvider {
  async sendTemplate(
    to: string,
    templateName: string,
    variables: string[]
  ): Promise<{ messageId: string }> {
    const id = `noop_${Date.now()}`;
    console.log(`[WhatsApp NoOp] Template: ${templateName} → ${to}`, {
      variables,
      messageId: id,
    });
    return { messageId: id };
  }
}

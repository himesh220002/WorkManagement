"use server";

import connectToDatabase from "@/lib/mongodb";
import { ContactMessage } from "@/models/contactMessage";

interface ContactSubmissionResult {
  success: boolean;
  messageId?: string;
  discordNotified?: boolean;
  error?: string;
}

/**
 * Saves a contact message to the database and dispatches a rich notification
 * to the configured Discord channel webhook.
 */
export async function submitContactInquiry(formData: FormData): Promise<ContactSubmissionResult> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const company = (formData.get("company") as string)?.trim() || "";
  const message = (formData.get("message") as string)?.trim();

  if (!name || !email || !message) {
    return {
      success: false,
      error: "Please provide your name, email, and message.",
    };
  }

  // Basic email sanity check
  if (!email.includes("@") || !email.includes(".")) {
    return {
      success: false,
      error: "Please enter a valid email address.",
    };
  }

  try {
    await connectToDatabase();

    // 1. Save to Database
    const doc = await ContactMessage.create({
      name,
      email,
      company,
      message,
      status: "new",
      discordNotified: false,
    });

    let discordNotified = false;

    // 2. Dispatch Discord Webhook Notification if configured
    const discordWebhookUrl = (
      process.env.DISCORD_WEBHOOK_URL ||
      process.env.DISCORD_WEBHOOK ||
      ""
    ).trim();

    if (discordWebhookUrl && discordWebhookUrl.startsWith("http")) {
      try {
        const payload = {
          username: "TaskPMS Inquiries",
          avatar_url: "https://work-management-teal.vercel.app/favicon.ico",
          embeds: [
            {
              title: "📬 New Contact Inquiry Received",
              description: "A visitor has submitted an inquiry on the TaskPMS Contact Page.",
              color: 0x5865f2, // Discord Blurple
              fields: [
                {
                  name: "👤 Sender Name",
                  value: name,
                  inline: true,
                },
                {
                  name: "📧 Email",
                  value: email,
                  inline: true,
                },
                {
                  name: "🏢 Organization / Company",
                  value: company || "Not specified",
                  inline: true,
                },
                {
                  name: "💬 Message Content",
                  value: message.length > 1024 ? message.slice(0, 1020) + "..." : message,
                  inline: false,
                },
              ],
              footer: {
                text: "TaskPMS Enterprise System • taskpms.cyphertech.online",
              },
              timestamp: new Date().toISOString(),
            },
          ],
        };

        const res = await fetch(discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok || res.status === 204) {
          discordNotified = true;
          // Mark doc as notified
          await ContactMessage.findByIdAndUpdate(doc._id, { $set: { discordNotified: true } });
        } else {
          console.warn("Discord Webhook responded with status:", res.status);
        }
      } catch (webhookErr) {
        console.error("Failed to post to Discord webhook:", webhookErr);
      }
    }

    return {
      success: true,
      messageId: doc._id.toString(),
      discordNotified,
    };
  } catch (err: any) {
    console.error("Error submitting contact inquiry:", err);
    return {
      success: false,
      error: err.message || "Failed to process inquiry. Please try again later.",
    };
  }
}

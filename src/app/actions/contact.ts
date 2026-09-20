"use server";

import { Resend } from "resend";
import { requireUser } from "@/app/actions/auth";
import { buildSupportEmail, parseSupportInput } from "@/lib/contact";
import {
  assertContactNotRateLimited,
  recordContactAttempt,
} from "@/lib/rate-limit";

export type ContactActionResult = { error: string } | { ok: true };

export async function sendSupportMessage(input: {
  email: string;
  topic: string;
  message: string;
}): Promise<ContactActionResult> {
  const user = await requireUser();
  const rateKey = `contact:${user.id}`;
  const limited = assertContactNotRateLimited(rateKey);
  if (!limited.ok) return { error: limited.error };

  const parsed = parseSupportInput(input);
  if (!parsed.ok) return { error: parsed.error };

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const toEmail = process.env.CONTACT_EMAIL?.trim() || "jan@janrosell.com";
  const fromEmail = process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";

  if (!apiKey) {
    return { error: "Email service not configured." };
  }

  const email = buildSupportEmail({
    username: user.username,
    email: parsed.email,
    topic: parsed.topic,
    message: parsed.message,
  });

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: parsed.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { error: "Failed to send message. Please try again later." };
    }
  } catch (error) {
    console.error("Contact error:", error);
    return { error: "Failed to send message. Please try again later." };
  }

  recordContactAttempt(rateKey);
  return { ok: true };
}

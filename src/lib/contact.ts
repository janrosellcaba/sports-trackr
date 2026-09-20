export const SUPPORT_EMAIL = "jan@janrosell.com";
export const SUPPORT_TOPICS = ["Help", "Bug", "Idea"] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];
export const MAX_SUPPORT_MESSAGE = 2000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParsedSupportInput = {
  email: string;
  topic: SupportTopic;
  message: string;
};

export function isSupportTopic(value: string): value is SupportTopic {
  return (SUPPORT_TOPICS as readonly string[]).includes(value);
}

export function parseSupportInput(input: {
  email: unknown;
  topic: unknown;
  message: unknown;
}): ({ ok: true } & ParsedSupportInput) | { ok: false; error: string } {
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const topic = typeof input.topic === "string" ? input.topic.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!email || !topic || !message) {
    return { ok: false, error: "Please fill in your email and message." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!isSupportTopic(topic)) {
    return { ok: false, error: "Please choose a valid topic." };
  }
  if (message.length > MAX_SUPPORT_MESSAGE) {
    return {
      ok: false,
      error: `Message is too long (max ${MAX_SUPPORT_MESSAGE} characters).`,
    };
  }
  return { ok: true, email, topic, message };
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSupportEmail(input: {
  username: string;
  email: string;
  topic: SupportTopic;
  message: string;
}): { subject: string; text: string; html: string } {
  const safeUsername = escapeHtml(input.username);
  const safeEmail = escapeHtml(input.email);
  const safeTopic = escapeHtml(input.topic);
  const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br />");

  return {
    subject: `[Trackr] ${input.topic} from ${input.username}`,
    text: `From: ${input.username} <${input.email}>\nTopic: ${input.topic}\n\n${input.message}`,
    html: `
      <p style="font-size:18px;margin:0 0 16px;">
        <strong>Reply to:</strong>
        <a href="mailto:${safeEmail}">${safeEmail}</a>
      </p>
      <p style="margin:0 0 8px;"><strong>Username:</strong> ${safeUsername}</p>
      <p style="margin:0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
      <p style="margin:0 0 16px;"><strong>Topic:</strong> ${safeTopic}</p>
      <p style="margin:0 0 8px;"><strong>Message:</strong></p>
      <p style="margin:0;">${safeMessage}</p>
    `,
  };
}

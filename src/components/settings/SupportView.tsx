"use client";

import { useState, useTransition, type FormEvent } from "react";
import { sendSupportMessage } from "@/app/actions/contact";
import {
  MAX_SUPPORT_MESSAGE,
  SUPPORT_EMAIL,
  SUPPORT_TOPICS,
  type SupportTopic,
} from "@/lib/contact";
import { CARD_CLS, INPUT_CLS, LABEL_CLS, PRIMARY_BTN, chipClass } from "@/lib/ui";

export function SupportView() {
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<SupportTopic>("Help");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    startTransition(async () => {
      const result = await sendSupportMessage({ email, topic, message });
      if ("error" in result) {
        setStatus({ type: "error", text: result.error });
        return;
      }
      setMessage("");
      setStatus({ type: "success", text: "Message sent — thanks for reaching out!" });
    });
  }

  return (
    <section className={`${CARD_CLS} space-y-4 p-4`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className={`mb-1 block ${LABEL_CLS}`}>Your email</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            className={INPUT_CLS}
          />
        </label>

        <fieldset className="space-y-2">
          <legend className={LABEL_CLS}>Topic</legend>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Topic">
            {SUPPORT_TOPICS.map((item) => (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={topic === item}
                onClick={() => setTopic(item)}
                className={`${chipClass(topic === item)} w-full py-3`}
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className={`mb-1 block ${LABEL_CLS}`}>Message</span>
          <textarea
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
            rows={5}
            maxLength={MAX_SUPPORT_MESSAGE}
            placeholder="What were you doing, and roughly when?"
            className={`${INPUT_CLS} resize-y`}
          />
        </label>

        {status ? (
          <p
            role={status.type === "error" ? "alert" : "status"}
            className={`text-sm font-medium ${
              status.type === "success" ? "text-brand-text" : "text-danger"
            }`}
          >
            {status.text}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className={`${PRIMARY_BTN} w-full bg-brand py-3 text-base hover:bg-brand-dark`}
        >
          {pending ? "Sending…" : "Send message"}
        </button>
      </form>
      <p className="text-xs text-muted">
        Or email{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=Trackr%20support`}
          className="font-medium text-brand-text hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
      </p>
    </section>
  );
}

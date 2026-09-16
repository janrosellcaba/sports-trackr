"use client";

import { useState } from "react";
import { INPUT_CLS } from "@/lib/ui";
import { MAX_PASSWORD_LENGTH } from "@/lib/constants";

export function PasswordField({
  autoComplete,
  minLength,
  placeholder,
  name = "password",
}: {
  autoComplete: string;
  minLength?: number;
  placeholder: string;
  name?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        maxLength={MAX_PASSWORD_LENGTH}
        placeholder={placeholder}
        className={`${INPUT_CLS} pr-20`}
      />
      <button
        type="button"
        onClick={() => setShow((current) => !current)}
        className="absolute top-1/2 right-2 min-h-11 min-w-11 -translate-y-1/2 text-sm font-bold text-muted hover:text-ink"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

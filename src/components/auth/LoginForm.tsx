"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { login } from "@/app/actions/auth";
import { PasswordField } from "@/components/auth/PasswordField";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { INPUT_CLS, PRIMARY_BTN } from "@/lib/ui";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
    >
      {pending ? "Please wait…" : "Log in"}
    </button>
  );
}

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      action={async (formData) => {
        setError(null);
        const result = await login(formData);
        if (result?.error) setError(result.error);
      }}
    >
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink">
          Username
        </span>
        <input
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          placeholder="your name"
          className={INPUT_CLS}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink">
          Password
        </span>
        <PasswordField
          autoComplete="current-password"
          placeholder="Your password"
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      <SubmitButton />

      <Link
        href="/register"
        className="mt-2 block w-full rounded-xl py-2 text-center text-sm font-semibold text-muted transition-all duration-150 hover:bg-chip hover:text-ink"
      >
        Create an account
      </Link>
      <p className="text-center text-xs text-muted">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-medium text-brand-text hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
      </p>
    </form>
  );
}

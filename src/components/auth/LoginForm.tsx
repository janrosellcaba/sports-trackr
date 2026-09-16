"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { login } from "@/app/actions/auth";
import { PasswordField } from "@/components/auth/PasswordField";
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
        <span className="mt-1 block text-xs text-muted">Stored in lowercase.</span>
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
        className="mt-2 block w-full text-center text-sm font-semibold text-muted transition-colors duration-150 hover:text-ink"
      >
        New here? Create an account
      </Link>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { login } from "@/app/actions/auth";
import { INPUT_CLS, PRIMARY_BTN } from "@/lib/ui";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
    >
      {pending ? "Please wait…" : "Log In"}
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
          placeholder="e.g. jan"
          className={INPUT_CLS}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink">
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className={INPUT_CLS}
        />
      </label>

      {error ? (
        <p className="text-sm font-medium text-danger">{error}</p>
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

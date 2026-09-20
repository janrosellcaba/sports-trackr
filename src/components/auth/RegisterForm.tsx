"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { register } from "@/app/actions/auth";
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
      {pending ? "Please wait…" : "Create account"}
    </button>
  );
}

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      action={async (formData) => {
        setError(null);
        const result = await register(formData);
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
          placeholder="letters, numbers, . _ -"
          className={INPUT_CLS}
        />
        <span className="mt-1 block text-xs text-muted">
          2–32 characters, saved in lowercase.
        </span>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink">
          Password
        </span>
        <PasswordField
          autoComplete="new-password"
          minLength={8}
          placeholder="At least 8 characters"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink">
          Registration code
        </span>
        <input
          name="inviteCode"
          type="text"
          autoComplete="off"
          required
          placeholder="Invite code"
          className={INPUT_CLS}
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      <SubmitButton />

      <Link
        href="/login"
        className="mt-2 block w-full rounded-xl py-2 text-center text-sm font-semibold text-muted transition-all duration-150 hover:bg-chip hover:text-ink"
      >
        Already have an account? Log in
      </Link>
    </form>
  );
}

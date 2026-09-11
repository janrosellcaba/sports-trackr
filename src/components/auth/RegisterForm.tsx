"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { register } from "@/app/actions/auth";

const inputClass =
  "h-12 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 text-base text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-lime-400/50";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-lime-400 text-sm font-semibold text-neutral-950 transition disabled:opacity-50"
    >
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        setError(null);
        const result = await register(formData);
        if (result?.error) setError(result.error);
      }}
    >
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-neutral-300">Username</span>
        <input
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          placeholder="e.g. jan"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-neutral-300">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-neutral-300">
          Invite / Secret Code
        </span>
        <input
          name="inviteCode"
          type="text"
          autoComplete="off"
          required
          placeholder="Enter access code"
          className={inputClass}
        />
      </label>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <SubmitButton />

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="text-lime-400 hover:text-lime-300">
          Sign in
        </Link>
      </p>
    </form>
  );
}

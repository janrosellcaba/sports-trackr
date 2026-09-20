"use client";

export default function ErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-5 py-16 text-center">
      <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">
        {error.message || "Please try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-2xl bg-brand px-5 py-3 font-bold text-[color:var(--accent-fg)] transition-all duration-150 hover:bg-brand-dark motion-safe:hover:-translate-y-0.5"
      >
        Try again
      </button>
    </div>
  );
}

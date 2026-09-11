import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-50">
            Trackr
          </h1>
          <p className="text-sm text-neutral-400">
            Sign in to log gym, sports, and supplements.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

import { RegisterForm } from "@/components/auth/RegisterForm";
import { Logo } from "@/components/ui/Logo";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-neutral-100">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <p className="text-sm text-neutral-400">
            Create an account with your invite code.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-850 bg-neutral-950/80 p-5">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}

import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  return (
    <main className="flex h-full items-center justify-center overflow-y-auto bg-cream px-5 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-paper p-8 shadow-sm">
        <div className="mb-3 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-center text-3xl font-extrabold tracking-tight text-ink">
          Trackr
        </h1>
        <p className="mb-6 text-center text-sm text-muted">Welcome back.</p>
        <LoginForm />
      </div>
    </main>
  );
}

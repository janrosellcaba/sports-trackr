import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ui/Logo";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="app-shell relative flex h-full items-center justify-center overflow-y-auto px-5 py-10">
      <div className="card-lux w-full max-w-sm rounded-[1.35rem] p-8">
        <div className="mb-3 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-6 text-center font-display text-2xl font-extrabold tracking-tight text-ink">
          Log in
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}

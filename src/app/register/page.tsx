import { RegisterForm } from "@/components/auth/RegisterForm";
import { Logo } from "@/components/ui/Logo";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <main className="app-shell relative flex h-full items-center justify-center overflow-y-auto px-5 py-10">
      <div className="card-lux w-full max-w-sm rounded-[1.35rem] p-8">
        <div className="mb-3 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-6 text-center font-display text-2xl font-extrabold tracking-tight text-ink">
          Create account
        </h1>
        <RegisterForm />
      </div>
    </main>
  );
}

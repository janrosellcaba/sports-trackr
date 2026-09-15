import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Logo } from "@/components/ui/Logo";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return (
    <main className="flex h-full items-center justify-center overflow-y-auto bg-cream px-5 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-paper p-8 shadow-sm">
        <div className="mb-3 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-6 text-center text-xl font-semibold tracking-tight text-ink">
          Create account
        </h1>
        <RegisterForm />
      </div>
    </main>
  );
}

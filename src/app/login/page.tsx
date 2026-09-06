import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/LoginForm";
import { InstallButton } from "@/components/InstallButton";

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-6">
          <Logo size={52} />
        </div>
        <div className="card p-6">
          <h1 className="text-xl font-bold mt-0 mb-5 text-center">
            تسجيل الدخول
          </h1>
          <Suspense fallback={<div className="text-center text-sm">…</div>}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="text-center text-sm mt-5" style={{ color: "var(--muted)" }}>
          ليس لديك حساب؟{" "}
          <Link href="/signup" style={{ color: "var(--brand)", fontWeight: 700 }}>
            أنشئ حسابًا
          </Link>
        </p>
        <div className="mt-4">
          <InstallButton className="btn btn-ghost w-full text-sm" />
        </div>
      </div>
    </main>
  );
}

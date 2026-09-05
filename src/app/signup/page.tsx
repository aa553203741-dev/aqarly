"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needConfirm, setNeedConfirm] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError("");
    type SignUpResult = Awaited<
      ReturnType<ReturnType<typeof createClient>["auth"]["signUp"]>
    >;
    let data: SignUpResult["data"] | undefined;
    let error: SignUpResult["error"] | undefined;
    try {
      const supabase = createClient();
      const email = (fd.get("email") as string).trim();
      ({ data, error } = await supabase.auth.signUp({
        email,
        password: fd.get("password") as string,
        options: {
          data: {
            full_name: (fd.get("full_name") as string).trim(),
            phone: ((fd.get("phone") as string) || "").trim(),
          },
        },
      }));
    } catch (ex) {
      setLoading(false);
      console.error("signup exception", ex);
      setError("استثناء: " + (ex instanceof Error ? ex.message : String(ex)));
      return;
    }
    setLoading(false);
    if (error) {
      console.error("signup error", error);
      setError(
        error.message.includes("already")
          ? "هذا البريد مسجّل مسبقًا"
          : "تعذّر: " + error.message,
      );
      return;
    }
    if (!data) return;
    // إن لم تُنشأ جلسة فورية => التأكيد بالبريد مفعّل
    if (!data.session) {
      setNeedConfirm(true);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (needConfirm) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px] card p-7 text-center">
          <div className="text-4xl mb-3">📧</div>
          <h1 className="text-lg font-bold m-0">أكّد بريدك الإلكتروني</h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
            أرسلنا رابط تأكيد إلى بريدك. افتحه ثم عُد لتسجيل الدخول.
          </p>
          <Link href="/login" className="btn btn-primary w-full mt-5">
            الذهاب لتسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-6">
          <Logo size={52} />
        </div>
        <div className="card p-6">
          <h1 className="text-xl font-bold mt-0 mb-5 text-center">
            حساب وسيط جديد
          </h1>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="label">الاسم الكامل</label>
              <input name="full_name" className="field" required />
            </div>
            <div>
              <label className="label">رقم الجوال</label>
              <input
                name="phone"
                type="tel"
                className="field"
                style={{ direction: "ltr", textAlign: "right" }}
                placeholder="05xxxxxxxx"
              />
            </div>
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                name="email"
                type="email"
                className="field"
                required
                style={{ direction: "ltr", textAlign: "right" }}
              />
            </div>
            <div>
              <label className="label">كلمة المرور</label>
              <input
                name="password"
                type="password"
                className="field"
                required
                minLength={6}
                style={{ direction: "ltr", textAlign: "right" }}
              />
            </div>
            {error && (
              <p className="text-sm" style={{ color: "var(--danger)" }}>
                {error}
              </p>
            )}
            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? "..." : "إنشاء الحساب"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm mt-5" style={{ color: "var(--muted)" }}>
          لديك حساب؟{" "}
          <Link href="/login" style={{ color: "var(--brand)", fontWeight: 700 }}>
            سجّل الدخول
          </Link>
        </p>
      </div>
    </main>
  );
}

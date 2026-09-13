"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const expired = search.get("expired") === "1";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: (fd.get("email") as string).trim(),
      password: fd.get("password") as string,
    });
    setLoading(false);
    if (error) {
      setError("بيانات الدخول غير صحيحة");
      return;
    }
    router.push(search.get("next") || "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {expired && !error && (
        <p
          className="text-sm text-center rounded-lg p-2 mb-1"
          style={{
            color: "var(--warn, #d97706)",
            background: "color-mix(in srgb, var(--warn, #d97706) 10%, transparent)",
          }}
        >
          انتهت مدة الجلسة. سجّل الدخول من جديد للمتابعة.
        </p>
      )}
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
          style={{ direction: "ltr", textAlign: "right" }}
        />
      </div>
      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <button className="btn btn-primary w-full" disabled={loading}>
        {loading ? "..." : "دخول"}
      </button>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { needsUnlock, verifyBiometric } from "@/lib/biometric";

// بوّابة قفل بالبصمة: تغطّي التطبيق عند إعادة الفتح حتى يتحقّق المستخدم.
export function BiometricLock() {
  const router = useRouter();
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!needsUnlock()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocked(true);
    unlock(); // محاولة الفتح تلقائيًا فور التحميل
  }, []);

  async function unlock() {
    setBusy(true);
    setError("");
    const ok = await verifyBiometric();
    setBusy(false);
    if (ok) setLocked(false);
    else setError("تعذّر التحقّق. حاول مجددًا.");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!locked) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg, var(--surface))" }}
    >
      <Logo size={56} />
      <div className="text-5xl mt-8 mb-2">🔒</div>
      <h1 className="text-lg font-bold m-0">التطبيق مقفل</h1>
      <p className="text-sm mt-2 text-center" style={{ color: "var(--muted)" }}>
        افتح باستخدام بصمتك أو التعرّف على الوجه للمتابعة.
      </p>
      {error && (
        <p className="text-sm mt-3" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <button
        onClick={unlock}
        disabled={busy}
        className="btn btn-primary w-full max-w-[300px] mt-5"
      >
        {busy ? "جارِ التحقّق…" : "🔓 فتح بالبصمة"}
      </button>
      <button
        onClick={signOut}
        className="btn btn-ghost w-full max-w-[300px] mt-2 text-sm"
      >
        تسجيل الخروج
      </button>
    </div>
  );
}

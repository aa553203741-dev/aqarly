"use client";

import { useEffect, useState } from "react";
import {
  biometricSupported,
  biometricEnabled,
  enableBiometric,
  disableBiometric,
} from "@/lib/biometric";

export function BiometricToggle({ userName }: { userName: string }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    biometricSupported().then((s) => {
      setSupported(s);
      if (s) setOn(biometricEnabled());
    });
  }, []);

  async function toggle() {
    setError("");
    if (on) {
      disableBiometric();
      setOn(false);
      return;
    }
    setBusy(true);
    try {
      await enableBiometric(userName);
      setOn(true);
    } catch {
      setError("تعذّر تفعيل البصمة. تأكّد من إعداد البصمة في جهازك.");
    }
    setBusy(false);
  }

  if (supported === null) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold">تسجيل الدخول بالبصمة</div>
          <p className="text-xs mt-0.5 m-0" style={{ color: "var(--muted)" }}>
            {supported
              ? "اقفل التطبيق على هذا الجهاز، ويُفتح ببصمتك أو وجهك عند إعادة الفتح."
              : "جهازك أو متصفّحك لا يدعم البصمة."}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={!supported || busy}
          aria-pressed={on}
          aria-label="تبديل قفل البصمة"
          className="shrink-0 rounded-full transition-colors"
          style={{
            width: 48,
            height: 28,
            background: on ? "var(--brand)" : "var(--border)",
            opacity: supported ? 1 : 0.5,
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              right: on ? 3 : 23,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#fff",
              transition: "right .15s",
            }}
          />
        </button>
      </div>
      {error && (
        <p className="text-sm mt-2 mb-0" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

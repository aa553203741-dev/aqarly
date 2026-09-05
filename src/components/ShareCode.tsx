"use client";

import { useState } from "react";

export function ShareCode({ code }: { code: string }) {
  const [copied, setCopied] = useState<"" | "code" | "link">("");

  const link =
    typeof window !== "undefined" ? `${window.location.origin}/lead/${code}` : "";

  async function copy(text: string, which: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* المتصفح منع النسخ — يتجاهل بهدوء */
    }
  }

  if (!code) {
    return (
      <div className="card p-6 text-center" style={{ color: "var(--muted)" }}>
        يُنشأ كودك تلقائيًا. حدّث الصفحة إن لم يظهر.
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="text-sm mb-2" style={{ color: "var(--muted)" }}>
        كود الوسيط الخاص بك
      </div>
      <div
        className="text-3xl font-extrabold tracking-[6px] mb-4"
        style={{ color: "var(--brand)", direction: "ltr" }}
      >
        {code}
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => copy(code, "code")} className="btn btn-ghost text-sm">
          {copied === "code" ? "✓ نُسخ" : "نسخ الكود"}
        </button>
        <button onClick={() => copy(link, "link")} className="btn btn-primary text-sm">
          {copied === "link" ? "✓ نُسخ الرابط" : "نسخ رابط النموذج"}
        </button>
        <a
          className="btn btn-ghost text-sm"
          href={`https://wa.me/?text=${encodeURIComponent(
            `قدّم طلبك العقاري عبر هذا الرابط: ${link}`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          مشاركة واتساب
        </a>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

// مشاركة رابط الكتالوج العام بكود المسوّق — أي حجز زيارة يصل باسمه.
export function CatalogShare({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const path = `/explore${code ? `?b=${code}` : ""}`;
  const link =
    typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  const waText = encodeURIComponent(`تصفّح أحدث العروض العقارية المتاحة:\n${link}`);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* المتصفح منع النسخ */
    }
  }

  return (
    <div className="card p-5">
      <h2 className="text-base font-bold mt-0 mb-1">رابط الكتالوج العام</h2>
      <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
        شارك كل وحداتك المتاحة في صفحة واحدة. أي حجز زيارة عبر هذا الرابط يصلك
        باسمك.
      </p>

      <div
        className="rounded-lg px-3 py-2 mb-3 text-sm"
        style={{
          background: "color-mix(in srgb, var(--text) 6%, transparent)",
          direction: "ltr",
          textAlign: "left",
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {link}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={copy} className="btn btn-primary flex-1">
          {copied ? "✓ نُسخ الرابط" : "نسخ الرابط"}
        </button>
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost flex-1"
        >
          مشاركة عبر واتساب
        </a>
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
        >
          فتح
        </a>
      </div>
    </div>
  );
}

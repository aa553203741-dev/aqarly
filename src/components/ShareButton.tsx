"use client";

import { useState } from "react";

export function ShareButton({
  unitId,
  summary,
  className = "btn btn-ghost !py-1.5 !px-3 text-sm",
}: {
  unitId: string;
  summary: string; // نص ملخّص يُرسل مع الرابط
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== "undefined" ? `${window.location.origin}/u/${unitId}` : "";
  const waText = encodeURIComponent(`${summary}\n${link}`);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* المتصفح منع النسخ */
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "عرض عقاري", text: summary, url: link });
        return;
      } catch {
        /* أُلغيت المشاركة */
      }
    }
    setOpen(true);
  }

  return (
    <>
      <button onClick={nativeShare} className={className}>
        📤 مشاركة
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-[360px] p-5 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold m-0">مشاركة العرض</h2>
              <button onClick={() => setOpen(false)} className="btn btn-ghost !py-1 !px-3">
                ✕
              </button>
            </div>
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full"
            >
              مشاركة عبر واتساب
            </a>
            <button onClick={copy} className="btn btn-ghost w-full">
              {copied ? "✓ نُسخ الرابط" : "نسخ الرابط"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

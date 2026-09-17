"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function BookVisit({
  unitId,
  brokerCode,
}: {
  unitId: string;
  brokerCode?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string).trim();
    const phone = (fd.get("phone") as string).trim();
    if (!name || !phone) {
      setError("الاسم ورقم الجوال مطلوبان");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data, error: e2 } = await supabase.rpc("book_visit", {
      p_unit_id: unitId,
      p_name: name,
      p_phone: phone,
      p_preferred: ((fd.get("preferred") as string) || "").trim(),
      p_note: ((fd.get("note") as string) || "").trim(),
      p_broker_code: brokerCode || null,
    });
    setSaving(false);
    if (e2 || (data && data !== "ok")) {
      setError("تعذّر إرسال الطلب، حاول مجددًا");
      return;
    }
    setDone(true);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary text-sm">
        📅 حجز زيارة
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full sm:max-w-[400px] p-5 rounded-b-none sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold m-0">حجز زيارة للعقار</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-lg"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            {done ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-bold m-0">تم إرسال طلبك</p>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                  سيتواصل معك المسوّق لتأكيد موعد الزيارة.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost w-full mt-4"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-3">
                <div>
                  <label className="label">الاسم *</label>
                  <input name="name" className="field" required />
                </div>
                <div>
                  <label className="label">رقم الجوال *</label>
                  <input
                    name="phone"
                    type="tel"
                    className="field"
                    required
                    style={{ direction: "ltr", textAlign: "right" }}
                    placeholder="05xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="label">الوقت المفضّل للزيارة</label>
                  <input
                    name="preferred"
                    className="field"
                    placeholder="مثال: الأحد بعد العصر"
                  />
                </div>
                <div>
                  <label className="label">ملاحظة (اختياري)</label>
                  <textarea name="note" className="field" rows={2} />
                </div>
                {error && (
                  <p className="text-sm" style={{ color: "var(--danger)" }}>
                    {error}
                  </p>
                )}
                <button className="btn btn-primary w-full" disabled={saving}>
                  {saving ? "..." : "إرسال الطلب"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

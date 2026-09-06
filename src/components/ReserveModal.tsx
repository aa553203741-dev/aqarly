"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ReserveTarget = {
  id: string;
  price: number | null;
  label: string; // نص وصفي (المشروع + رقم الوحدة)
};

export function ReserveModal({
  unit,
  onClose,
  onReserved,
}: {
  unit: ReserveTarget;
  onClose: () => void;
  onReserved: (reservationId: string) => void;
}) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [agreedPrice, setAgreedPrice] = useState(
    unit.price != null ? String(unit.price) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("reserve_unit", {
      p_unit_id: unit.id,
      p_client_name: clientName.trim() || null,
      p_client_phone: clientPhone.trim() || null,
      p_agreed_price: agreedPrice ? Number(agreedPrice) : null,
    });
    setSaving(false);
    if (error) {
      setError(
        error.message.includes("غير متاحة")
          ? "الوحدة لم تعد متاحة (ربما حجزها آخر)."
          : error.message.includes("غير مصرّح")
            ? "ليست لديك صلاحية الحجز."
            : "تعذّر الحجز: " + error.message,
      );
      return;
    }
    onReserved(data as string);
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.5)" }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="card w-full max-w-[440px] p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold m-0">حجز وحدة</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost !py-1 !px-3">
            ✕
          </button>
        </div>
        <p className="text-sm m-0" style={{ color: "var(--muted)" }}>
          {unit.label}
        </p>

        <div>
          <label className="label">اسم العميل *</label>
          <input
            className="field"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">جوال العميل</label>
          <input
            className="field"
            style={{ direction: "ltr", textAlign: "right" }}
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="label">السعر المتفق (ر.س)</label>
          <input
            className="field"
            type="number"
            value={agreedPrice}
            onChange={(e) => setAgreedPrice(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          سيُسجَّل الحجز باسمك وتُثبَّت عمولتك، ويتابع الموظفون إجراءات الدفع.
        </p>
        <button className="btn btn-primary w-full" disabled={saving}>
          {saving ? "جارِ الحجز…" : "تأكيد الحجز"}
        </button>
      </form>
    </div>
  );
}

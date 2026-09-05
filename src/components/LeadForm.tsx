"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CITIES,
  DEAL_TYPES,
  PROPERTY_TYPES,
} from "@/lib/constants";

export function LeadForm({
  brokerUserId,
  brokerName,
}: {
  brokerUserId: string;
  brokerName: string;
}) {
  const [propertyType, setPropertyType] = useState("apartment");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const openedAt = useRef(Date.now());

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // دفاعات صامتة ضد البوتات: حقل خفي + حد زمني بشري معقول
    const honeypot = (fd.get("company_website") as string) || "";
    const tooFast = Date.now() - openedAt.current < 1500;
    if (honeypot.trim() || tooFast) {
      setDone(true); // البوت يرى نفس شاشة النجاح دون أن يُحفظ شيء
      return;
    }

    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.from("client_leads").insert({
      broker_user_id: brokerUserId,
      client_name: (fd.get("name") as string).trim(),
      phone: (fd.get("phone") as string).trim(),
      deal_type: fd.get("dealType"),
      property_type: propertyType,
      property_type_other:
        propertyType === "other"
          ? ((fd.get("propertyTypeOther") as string) || "").trim()
          : "",
      city: fd.get("city"),
      district: ((fd.get("district") as string) || "").trim(),
      budget: fd.get("budget") ? Number(fd.get("budget")) : null,
      notes: ((fd.get("notes") as string) || "").trim(),
      status: "new",
    });
    setLoading(false);
    if (error) {
      setError("تعذّر إرسال الطلب، حاول مرة أخرى");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="text-xl font-bold m-0">تم استلام طلبك</h3>
        <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
          {brokerName
            ? `سيتواصل معك الوسيط ${brokerName} في أقرب وقت.`
            : "سيتواصل معك الوسيط في أقرب وقت."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className="label">اسم العميل *</label>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">نوع الطلب *</label>
          <select name="dealType" className="field" required defaultValue="buy">
            {DEAL_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">نوع العقار *</label>
          <select
            name="propertyType"
            className="field"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            required
          >
            {PROPERTY_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {propertyType === "other" && (
        <div>
          <label className="label">حدّد نوع العقار</label>
          <input name="propertyTypeOther" className="field" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">المدينة *</label>
          <select name="city" className="field" required defaultValue="">
            <option value="" disabled>
              — اختر المدينة —
            </option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">الحي</label>
          <input name="district" className="field" />
        </div>
      </div>

      <div>
        <label className="label">الميزانية (ر.س)</label>
        <input name="budget" type="number" min="0" className="field" />
      </div>

      <div>
        <label className="label">إضافات على الطلب</label>
        <textarea name="notes" className="field" rows={3} />
      </div>

      {/* حقل خفي — الزوّار الحقيقيون لا يرونه ولا يملؤونه */}
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <button className="btn btn-primary w-full" disabled={loading}>
        {loading ? "جارِ الإرسال..." : "إرسال الطلب"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SESSION_OPTIONS = [
  { v: 30, label: "٣٠ دقيقة" },
  { v: 60, label: "ساعة" },
  { v: 240, label: "٤ ساعات" },
  { v: 480, label: "٨ ساعات" },
  { v: 1440, label: "يوم كامل" },
  { v: 10080, label: "أسبوع" },
];

const MEDIA_OPTIONS = [
  { v: 5, label: "٥ دقائق" },
  { v: 15, label: "١٥ دقيقة" },
  { v: 60, label: "ساعة" },
  { v: 240, label: "٤ ساعات" },
  { v: 1440, label: "يوم كامل" },
];

export function SystemSettingsForm({
  sessionMinutes,
  mediaLinkMinutes,
}: {
  sessionMinutes: number;
  mediaLinkMinutes: number;
}) {
  const [session, setSession] = useState(String(sessionMinutes));
  const [media, setMedia] = useState(String(mediaLinkMinutes));
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    setDone(false);
    const supabase = createClient();
    const { error: e } = await supabase.from("app_settings").upsert(
      [
        { key: "session_minutes", value: session, is_public: true },
        { key: "media_link_minutes", value: media, is_public: true },
      ],
      { onConflict: "key" },
    );
    setSaving(false);
    if (e) {
      setError("تعذّر الحفظ — تأكد من صلاحيتك.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-4">
        <div>
          <label className="label">مدة الجلسة قبل طلب تسجيل الدخول</label>
          <select
            className="field"
            value={session}
            onChange={(e) => {
              setSession(e.target.value);
              setDone(false);
            }}
          >
            {SESSION_OPTIONS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            عند تجاوز المدة يُطلب من كل مستخدم تسجيل الدخول من جديد.
          </p>
        </div>

        <div>
          <label className="label">مدة صلاحية روابط الصور والمخططات والفيديو</label>
          <select
            className="field"
            value={media}
            onChange={(e) => {
              setMedia(e.target.value);
              setDone(false);
            }}
          >
            {MEDIA_OPTIONS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            كل رابط وسائط يُشارَك ينتهي تلقائيًا بعد هذه المدة.
          </p>
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "..." : "حفظ"}
          </button>
          {done && (
            <span className="text-sm" style={{ color: "var(--brand)" }}>
              ✓ حُفظت الإعدادات
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

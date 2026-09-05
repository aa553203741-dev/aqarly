"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function SettingsForm({ profile }: { profile: Profile | null }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        full_name: (fd.get("full_name") as string).trim(),
        phone: ((fd.get("phone") as string) || "").trim(),
      })
      .eq("id", profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!profile) {
    return (
      <div className="card p-6" style={{ color: "var(--muted)" }}>
        تعذّر تحميل الملف الشخصي.
      </div>
    );
  }

  return (
    <form onSubmit={save} className="card p-6 flex flex-col gap-4">
      <div>
        <label className="label">البريد الإلكتروني</label>
        <input
          className="field"
          value={profile.email ?? ""}
          disabled
          style={{ direction: "ltr", textAlign: "right", opacity: 0.7 }}
        />
      </div>
      <div>
        <label className="label">الاسم الكامل</label>
        <input name="full_name" className="field" defaultValue={profile.full_name ?? ""} required />
      </div>
      <div>
        <label className="label">رقم الجوال</label>
        <input
          name="phone"
          className="field"
          defaultValue={profile.phone ?? ""}
          style={{ direction: "ltr", textAlign: "right" }}
        />
      </div>
      <div className="flex items-center gap-3">
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "..." : "حفظ"}
        </button>
        {saved && (
          <span className="text-sm font-bold" style={{ color: "var(--brand)" }}>
            ✓ تم الحفظ
          </span>
        )}
      </div>
    </form>
  );
}

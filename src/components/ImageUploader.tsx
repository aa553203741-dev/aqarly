"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "project-media";

export function ImageUploader({
  value,
  onUploaded,
  label = "صورة",
}: {
  value?: string | null;
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `covers/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) {
      setUploading(false);
      setError("تعذّر الرفع: " + upErr.message);
      return;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setUploading(false);
    onUploaded(data.publicUrl);
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="w-16 h-16 object-cover rounded-lg"
            style={{ border: "1px solid var(--border)" }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl"
            style={{ background: "var(--brand-soft)" }}
          >
            🏢
          </div>
        )}
        <label className="btn btn-ghost text-sm cursor-pointer">
          {uploading ? "جارِ الرفع…" : value ? "تغيير الصورة" : "رفع صورة"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
            disabled={uploading}
          />
        </label>
      </div>
      {error && (
        <p className="text-sm mt-1" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

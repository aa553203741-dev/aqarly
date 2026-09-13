"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "project-media";
const MB = 1024 * 1024;

async function put(file: File, folder: string) {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

const isImage = (url: string) => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url);

/* ── معرض صور: عدة ملفات، مع حذف وإعادة ترتيب بالسحب البسيط ── */
export function GalleryUploader({
  value,
  onChange,
  label = "صور النموذج",
  max = 12,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  max?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError("");

    const room = max - value.length;
    if (room <= 0) {
      setError(`الحد الأقصى ${max} صور. احذف صورة لإضافة أخرى.`);
      return;
    }
    const tooBig = files.find((f) => f.size > 10 * MB);
    if (tooBig) {
      setError(`«${tooBig.name}» أكبر من ١٠ ميجابايت. اضغط الصورة ثم أعد الرفع.`);
      return;
    }

    setBusy(true);
    try {
      const urls = await Promise.all(files.slice(0, room).map((f) => put(f, "models")));
      onChange([...value, ...urls]);
      if (files.length > room) setError(`رُفعت ${room} صور فقط — بلغت الحد الأقصى.`);
    } catch (ex) {
      setError("تعذّر الرفع: " + (ex as Error).message);
    }
    setBusy(false);
  }

  return (
    <div>
      <label className="label">
        {label}{" "}
        <span style={{ color: "var(--muted)", fontWeight: 400 }}>
          ({value.length}/{max})
        </span>
      </label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((url, i) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`صورة ${i + 1}`}
                className="w-20 h-20 object-cover rounded-lg"
                style={{ border: "1px solid var(--border)" }}
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((u) => u !== url))}
                aria-label="حذف الصورة"
                className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full text-xs font-bold"
                style={{
                  background: "var(--danger)",
                  color: "#fff",
                  border: "2px solid var(--card, #fff)",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="btn btn-ghost text-sm cursor-pointer">
        {busy ? "جارِ الرفع…" : "إضافة صور"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFiles}
          disabled={busy}
        />
      </label>

      {error && (
        <p className="text-sm mt-1" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ── ملف مفرد: المخطط (صورة/PDF) أو الفيديو ── */
export function FileUploader({
  value,
  onChange,
  label,
  accept,
  folder,
  maxMB,
  hint,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  accept: string;
  folder: string;
  maxMB: number;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (file.size > maxMB * MB) {
      setError(`الملف أكبر من ${maxMB} ميجابايت. اضغطه أو اختر ملفًا أصغر.`);
      return;
    }
    setBusy(true);
    try {
      onChange(await put(file, folder));
    } catch (ex) {
      setError("تعذّر الرفع: " + (ex as Error).message);
    }
    setBusy(false);
  }

  return (
    <div>
      <label className="label">{label}</label>

      {value && (
        <div className="flex items-center gap-3 mb-2">
          {isImage(value) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="w-20 h-20 object-cover rounded-lg"
              style={{ border: "1px solid var(--border)" }}
            />
          ) : (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm"
              style={{ color: "var(--brand)", fontWeight: 700 }}
            >
              فتح الملف المرفوع ↗
            </a>
          )}
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => onChange(null)}
          >
            حذف
          </button>
        </div>
      )}

      <label className="btn btn-ghost text-sm cursor-pointer">
        {busy ? "جارِ الرفع…" : value ? "استبدال الملف" : "رفع ملف"}
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={onFile}
          disabled={busy}
        />
      </label>

      {hint && !error && (
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-sm mt-1" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

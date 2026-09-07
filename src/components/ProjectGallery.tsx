"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImageUploader } from "@/components/ImageUploader";

export function ProjectGallery({
  projectId,
  initial,
  canManage,
}: {
  projectId: string;
  initial: string[];
  canManage: boolean;
}) {
  const [images, setImages] = useState<string[]>(initial ?? []);
  const [saving, setSaving] = useState(false);

  async function persist(next: string[]) {
    setImages(next);
    setSaving(true);
    const supabase = createClient();
    await supabase.from("projects").update({ images: next }).eq("id", projectId);
    setSaving(false);
  }

  async function add(url: string) {
    await persist([...images, url]);
  }
  async function remove(url: string) {
    await persist(images.filter((x) => x !== url));
  }

  if (images.length === 0 && !canManage) return null;

  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold m-0">معرض الصور</h2>
        {saving && (
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            جارِ الحفظ…
          </span>
        )}
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {images.map((src) => (
            <div key={src} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="w-full h-24 object-cover rounded-lg"
                style={{ border: "1px solid var(--border)" }}
              />
              {canManage && (
                <button
                  onClick={() => remove(src)}
                  className="absolute top-1 left-1 rounded-full w-6 h-6 text-xs font-bold"
                  style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}
                  aria-label="حذف"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
          لا صور بعد.
        </p>
      )}

      {canManage && (
        <ImageUploader label="إضافة صورة للمعرض" value={null} onUploaded={add} />
      )}
    </div>
  );
}

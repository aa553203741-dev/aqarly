import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS } from "@/lib/inventory-constants";
import type { Project } from "@/lib/inventory-types";

export default async function ProjectDetailPage({
  params,
}: PageProps<"/dashboard/projects/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*, developer:developers(name), district:districts(city, zone, name)")
    .eq("id", id)
    .maybeSingle();

  const p = data as Project | null;
  if (!p) notFound();

  const s = PROJECT_STATUS.find((x) => x.value === p.status) ?? PROJECT_STATUS[2];

  return (
    <div className="max-w-[820px]">
      <Link
        href="/dashboard/projects"
        className="text-sm"
        style={{ color: "var(--brand)" }}
      >
        ‹ كل المشاريع
      </Link>

      <div className="card overflow-hidden mt-3">
        {p.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover_image} alt="" className="w-full h-52 object-cover" />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold m-0">{p.name}</h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                {p.developer?.name && <span>{p.developer.name} · </span>}
                {p.district
                  ? `${p.district.city} — ${p.district.zone || ""} ${p.district.name}`
                  : ""}
              </p>
            </div>
            <span className="badge" style={{ background: s.color, color: "#fff" }}>
              {s.label}
            </span>
          </div>
          {p.description && (
            <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>
              {p.description}
            </p>
          )}
          <div className="flex gap-2 flex-wrap mt-4">
            {p.maps_url && (
              <a
                href={p.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost text-sm"
              >
                📍 الموقع على الخريطة
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6 mt-4 text-center" style={{ color: "var(--muted)" }}>
        <div className="text-3xl mb-2">🏗️</div>
        <div className="font-bold" style={{ color: "var(--text)" }}>
          النماذج والوحدات
        </div>
        <p className="text-sm mt-1">
          إدارة نماذج الشقق والوحدات الفعلية تأتي في المرحلة القادمة.
        </p>
      </div>
    </div>
  );
}

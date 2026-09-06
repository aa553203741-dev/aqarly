import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectCard } from "@/components/ProjectCard";
import type { District, Project, ProjectStat } from "@/lib/inventory-types";

export default async function DistrictProjectsPage({
  params,
}: PageProps<"/dashboard/inventory/[districtId]">) {
  const { districtId } = await params;
  const supabase = await createClient();

  const [{ data: district }, { data: projects }] = await Promise.all([
    supabase.from("districts").select("*").eq("id", districtId).maybeSingle(),
    supabase
      .from("projects")
      .select("*, developer:developers(name)")
      .eq("district_id", districtId)
      .order("name"),
  ]);

  const d = district as District | null;
  if (!d) notFound();
  const list = (projects as Project[]) ?? [];

  // إحصاءات المشاريع دفعة واحدة
  const ids = list.map((p) => p.id);
  const { data: statsData } = ids.length
    ? await supabase.from("project_stats").select("*").in("project_id", ids)
    : { data: [] };
  const statMap = new Map(
    ((statsData as ProjectStat[]) ?? []).map((s) => [s.project_id, s]),
  );

  return (
    <div>
      <Link href="/dashboard/inventory" className="text-sm" style={{ color: "var(--brand)" }}>
        ‹ خريطة التغطية
      </Link>
      <h1 className="text-2xl font-extrabold mt-2 mb-1">{d.name}</h1>
      <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
        {d.city}
        {d.zone ? ` — ${d.zone}` : ""} · {list.length} مشاريع
      </p>

      {list.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا توجد مشاريع في هذا الحي بعد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {list.map((p) => (
            <ProjectCard key={p.id} project={p} stat={statMap.get(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

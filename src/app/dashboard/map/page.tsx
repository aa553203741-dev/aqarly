import { createClient } from "@/lib/supabase/server";
import { ProjectsMap } from "@/components/ProjectsMap";
import type { Project } from "@/lib/inventory-types";

export default async function MapPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*, developer:developers(name), district:districts(city, zone, name)");

  const projects = (data as Project[]) ?? [];
  const withCoords = projects.filter((p) => p.lat != null && p.lng != null);
  const without = projects.length - withCoords.length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-1">خريطة المشاريع</h1>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
        {withCoords.length} مشروع على الخريطة
        {without > 0 ? ` · ${without} بلا إحداثيات (أضِف Latitude/Longitude)` : ""}
      </p>

      {projects.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          لا توجد مشاريع بعد.
        </div>
      ) : (
        <ProjectsMap projects={projects} />
      )}
    </div>
  );
}

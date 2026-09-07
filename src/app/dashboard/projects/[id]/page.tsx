import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import { PROJECT_STATUS } from "@/lib/inventory-constants";
import { ProjectInventory } from "@/components/ProjectInventory";
import { ProjectGallery } from "@/components/ProjectGallery";
import type { Project, UnitModel, Unit } from "@/lib/inventory-types";

export default async function ProjectDetailPage({
  params,
}: PageProps<"/dashboard/projects/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const me = await getMe();

  const [{ data: proj }, { data: models }, { data: units }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, developer:developers(name), district:districts(city, zone, name)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("unit_models").select("*").eq("project_id", id).order("name"),
    supabase
      .from("units")
      .select("*")
      .eq("project_id", id)
      .order("unit_no"),
  ]);

  const p = proj as Project | null;
  if (!p) notFound();
  const s = PROJECT_STATUS.find((x) => x.value === p.status) ?? PROJECT_STATUS[2];

  return (
    <div className="max-w-[900px]">
      <Link href="/dashboard/projects" className="text-sm" style={{ color: "var(--brand)" }}>
        ‹ كل المشاريع
      </Link>

      <div className="card overflow-hidden mt-3 mb-5">
        {p.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover_image} alt="" className="w-full h-44 object-cover" />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold m-0">{p.name}</h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                {p.developer?.name && <span>{p.developer.name} · </span>}
                {p.district ? `${p.district.city} — ${p.district.name}` : ""}
              </p>
            </div>
            <span className="badge" style={{ background: s.color, color: "#fff" }}>
              {s.label}
            </span>
          </div>
          {p.maps_url && (
            <a
              href={p.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost text-sm mt-3"
            >
              📍 الموقع
            </a>
          )}
        </div>
      </div>

      <ProjectGallery
        projectId={p.id}
        initial={p.images ?? []}
        canManage={me?.canManageInventory ?? false}
      />

      <ProjectInventory
        projectId={p.id}
        defaultCommission={p.default_commission_amount}
        initialModels={(models as UnitModel[]) ?? []}
        initialUnits={(units as Unit[]) ?? []}
        canManage={me?.canManageInventory ?? false}
      />
    </div>
  );
}

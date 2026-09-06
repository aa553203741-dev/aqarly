import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import { ProjectsManager } from "@/components/ProjectsManager";
import type { Developer, District, Project } from "@/lib/inventory-types";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const me = await getMe();

  const [{ data: projects }, { data: developers }, { data: districts }] =
    await Promise.all([
      supabase
        .from("projects")
        .select(
          "*, developer:developers(name), district:districts(city, zone, name)",
        )
        .order("created_at", { ascending: false }),
      supabase.from("developers").select("*").order("name"),
      supabase.from("districts").select("*").order("city"),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mt-0 mb-5">المشاريع</h1>
      <ProjectsManager
        initial={(projects as Project[]) ?? []}
        developers={(developers as Developer[]) ?? []}
        districts={(districts as District[]) ?? []}
        canManage={me?.canManageInventory ?? false}
      />
    </div>
  );
}

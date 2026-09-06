import Link from "next/link";
import { PROJECT_STATUS } from "@/lib/inventory-constants";
import type { Project, ProjectStat } from "@/lib/inventory-types";

export function ProjectCard({
  project: p,
  stat,
}: {
  project: Project;
  stat?: ProjectStat;
}) {
  const s = PROJECT_STATUS.find((x) => x.value === p.status) ?? PROJECT_STATUS[2];
  const areaRange =
    stat?.min_area != null
      ? stat.min_area === stat.max_area
        ? `${stat.min_area} م²`
        : `${stat.min_area}–${stat.max_area} م²`
      : null;
  const bedRange =
    stat?.min_bed != null
      ? stat.min_bed === stat.max_bed
        ? `${stat.min_bed} غرف`
        : `${stat.min_bed}–${stat.max_bed} غرف`
      : null;

  return (
    <div className="card overflow-hidden">
      {p.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.cover_image} alt="" className="w-full h-32 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="font-bold text-base">{p.name}</div>
          <span className="badge" style={{ background: s.color, color: "#fff" }}>
            {s.label}
          </span>
        </div>
        {p.developer?.name && (
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            {p.developer.name}
          </div>
        )}

        {stat?.start_price != null && (
          <div className="text-base font-extrabold mt-2" style={{ color: "var(--brand)" }}>
            يبدأ من {Number(stat.start_price).toLocaleString("en-US")} ر.س
          </div>
        )}

        <div className="flex gap-2 flex-wrap mt-2 text-sm">
          {areaRange && <Tag>{areaRange}</Tag>}
          {bedRange && <Tag>{bedRange}</Tag>}
          {stat != null && (
            <Tag>
              {stat.available_units} متاحة من {stat.total_units}
            </Tag>
          )}
        </div>

        <div className="flex gap-2 flex-wrap mt-3">
          <Link
            href={`/dashboard/projects/${p.id}`}
            className="btn btn-primary !py-1.5 !px-3 text-sm"
          >
            عرض المشروع
          </Link>
          {p.maps_url && (
            <a
              href={p.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost !py-1.5 !px-3 text-sm"
            >
              📍
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}>
      {children}
    </span>
  );
}

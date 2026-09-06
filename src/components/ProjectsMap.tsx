"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { PROJECT_STATUS } from "@/lib/inventory-constants";
import type { Project } from "@/lib/inventory-types";

export function ProjectsMap({ projects }: { projects: Project[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const withCoords = projects.filter((p) => p.lat != null && p.lng != null);
    let map: import("leaflet").Map | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!ref.current || ref.current.dataset.init) return;
      ref.current.dataset.init = "1";

      map = L.map(ref.current).setView([24.7136, 46.6753], 6); // مركز السعودية
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const bounds: [number, number][] = [];
      for (const p of withCoords) {
        const color =
          PROJECT_STATUS.find((s) => s.value === p.status)?.color ?? "#0d7a6e";
        const lat = p.lat as number;
        const lng = p.lng as number;
        bounds.push([lat, lng]);
        L.circleMarker([lat, lng], {
          radius: 9,
          color: "#fff",
          weight: 2,
          fillColor: color,
          fillOpacity: 0.95,
        })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:sans-serif;text-align:right;min-width:150px">
               <b>${escapeHtml(p.name)}</b><br/>
               <span style="color:#666;font-size:12px">${escapeHtml(p.developer?.name ?? "")}${
                 p.district ? " · " + escapeHtml(p.district.name) : ""
               }</span><br/>
               <a href="/dashboard/projects/${p.id}" style="color:#0d7a6e;font-weight:bold">عرض المشروع</a>
             </div>`,
          );
      }
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    })();

    return () => {
      if (ref.current) delete ref.current.dataset.init;
      map?.remove();
    };
  }, [projects]);

  return (
    <div
      ref={ref}
      className="w-full rounded-xl overflow-hidden"
      style={{ height: "70vh", minHeight: 360, border: "1px solid var(--border)" }}
    />
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c,
  );
}

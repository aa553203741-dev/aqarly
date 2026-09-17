import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signPublicMedia } from "@/lib/media-server";
import { Logo } from "@/components/Logo";
import { BookVisit } from "@/components/BookVisit";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PROJECT_STATUS, UNIT_STATUS } from "@/lib/inventory-constants";
import { APP_NAME } from "@/lib/constants";

export default async function PublicUnitPage({
  params,
  searchParams,
}: PageProps<"/u/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const brokerCode = typeof sp.b === "string" ? sp.b : undefined;
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_unit_card", { p_unit_id: id });
  const u = data?.[0];
  if (!u) notFound();

  const gallery: string[] = u.images ?? [];
  const features: string[] = u.features ?? [];
  const { sign } = await signPublicMedia([
    u.cover_image,
    u.floor_plan_url,
    u.video_url,
    ...gallery,
  ]);
  const coverSrc = sign(u.cover_image);
  const floorPlanSrc = sign(u.floor_plan_url);
  const videoSrc = sign(u.video_url);
  const gallerySrcs = gallery.map(sign).filter(Boolean) as string[];

  const price = u.discount_price ?? u.price;
  const ps = PROJECT_STATUS.find((s) => s.value === u.project_status);
  const us = UNIT_STATUS.find((s) => s.value === u.status);

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-[480px]">
        <div className="flex justify-center mb-5">
          <Logo size={44} />
        </div>

        <div className="card overflow-hidden relative">
          {u.cover_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt="" className="w-full h-52 object-cover" />
          )}
          <div className="absolute top-3 left-3">
            <FavoriteButton unitId={id} />
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-extrabold m-0">{u.project_name}</h1>
              {ps && (
                <span className="badge" style={{ background: ps.color, color: "#fff" }}>
                  {ps.label}
                </span>
              )}
            </div>
            <p className="text-sm mt-1 mb-0" style={{ color: "var(--muted)" }}>
              {u.developer_name &&
                (u.developer_id ? (
                  <Link
                    href={`/d/${u.developer_id}`}
                    style={{ color: "var(--brand)", fontWeight: 700 }}
                  >
                    {u.developer_name}
                  </Link>
                ) : (
                  <span>{u.developer_name}</span>
                ))}
              {u.developer_name && <span> · </span>}
              {u.city} — {u.district_name}
            </p>

            {price != null && (
              <div
                className="text-2xl font-extrabold mt-3"
                style={{ color: "var(--brand)" }}
              >
                {Number(price).toLocaleString("en-US")} ر.س
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Spec label="النموذج" value={u.model_name ?? "—"} />
              <Spec label="الوحدة" value={`${u.unit_no}${u.floor != null ? ` · دور ${u.floor}` : ""}`} />
              {u.bedrooms != null && <Spec label="الغرف" value={String(u.bedrooms)} />}
              {u.area != null && <Spec label="المساحة" value={`${u.area} م²`} />}
              {u.bathrooms != null && <Spec label="دورات المياه" value={String(u.bathrooms)} />}
              {u.unit_view && <Spec label="الإطلالة" value={u.unit_view} />}
              {us && <Spec label="الحالة" value={us.label} />}
            </div>

            {features.length > 0 && (
              <div className="mt-4">
                <div className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>
                  مكوّنات الشقة
                </div>
                <div className="flex gap-2 flex-wrap">
                  {features.map((f) => (
                    <span
                      key={f}
                      className="badge"
                      style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {gallerySrcs.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {gallerySrcs.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-full h-20 object-cover rounded-lg"
                    style={{ border: "1px solid var(--border)" }}
                  />
                ))}
              </div>
            )}

            {videoSrc && (
              <video
                controls
                preload="metadata"
                src={videoSrc}
                className="w-full rounded-lg mt-4"
                style={{ border: "1px solid var(--border)" }}
              />
            )}

            <div className="flex gap-2 flex-wrap mt-5">
              {floorPlanSrc && (
                <a
                  href={floorPlanSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost text-sm"
                >
                  📐 مخطط الوحدة
                </a>
              )}
              {u.maps_url && (
                <a
                  href={u.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost text-sm"
                >
                  📍 الموقع
                </a>
              )}
            </div>

            <div className="mt-3">
              <BookVisit unitId={id} brokerCode={brokerCode} />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          <Link
            href={`/explore${brokerCode ? `?b=${brokerCode}` : ""}`}
            className="btn btn-ghost text-sm"
          >
            تصفّح كل العروض
          </Link>
          <Link href="/favorites" className="btn btn-ghost text-sm">
            ♥ المفضّلة
          </Link>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "var(--muted)" }}>
          عرض مقدّم عبر{" "}
          <Link href="/" style={{ color: "var(--brand)", fontWeight: 700 }}>
            {APP_NAME}
          </Link>
        </p>
      </div>
    </main>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-2.5">
      <div className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="font-bold text-sm mt-0.5">{value}</div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type DistrictOpt = { id: string; city: string; name: string };

export function ExploreFilters({
  districts,
  brokerCode,
  initial,
}: {
  districts: DistrictOpt[];
  brokerCode?: string;
  initial: {
    city: string;
    district: string;
    beds: string;
    min: string;
    max: string;
  };
}) {
  const router = useRouter();
  const [city, setCity] = useState(initial.city);
  const [district, setDistrict] = useState(initial.district);
  const [beds, setBeds] = useState(initial.beds);
  const [min, setMin] = useState(initial.min);
  const [max, setMax] = useState(initial.max);

  const cities = useMemo(
    () => [...new Set(districts.map((d) => d.city))].sort(),
    [districts],
  );
  const cityDistricts = useMemo(
    () => districts.filter((d) => !city || d.city === city),
    [districts, city],
  );

  function apply() {
    const p = new URLSearchParams();
    if (city) p.set("city", city);
    if (district) p.set("district", district);
    if (beds) p.set("beds", beds);
    if (min) p.set("min", min);
    if (max) p.set("max", max);
    if (brokerCode) p.set("b", brokerCode);
    router.push(`/explore${p.toString() ? `?${p}` : ""}`);
  }

  function reset() {
    setCity("");
    setDistrict("");
    setBeds("");
    setMin("");
    setMax("");
    router.push(`/explore${brokerCode ? `?b=${brokerCode}` : ""}`);
  }

  return (
    <div className="card p-4 mb-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">المدينة</label>
          <select
            className="field"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setDistrict("");
            }}
          >
            <option value="">كل المدن</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">الحي</label>
          <select
            className="field"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="">كل الأحياء</option>
            {cityDistricts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">الغرف</label>
          <select
            className="field"
            value={beds}
            onChange={(e) => setBeds(e.target.value)}
          >
            <option value="">الكل</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">أقل سعر</label>
          <input
            className="field"
            type="number"
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">أعلى سعر</label>
          <input
            className="field"
            type="number"
            inputMode="numeric"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="بلا حد"
          />
        </div>
        <div className="flex items-end gap-2">
          <button onClick={apply} className="btn btn-primary flex-1">
            تطبيق
          </button>
          <button onClick={reset} className="btn btn-ghost">
            مسح
          </button>
        </div>
      </div>
    </div>
  );
}

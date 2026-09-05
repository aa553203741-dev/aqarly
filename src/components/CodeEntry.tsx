"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CodeEntry() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("lookup_broker_by_code", {
      p_code: clean,
    });
    setLoading(false);
    if (error || !data || data.length === 0) {
      setError("لم يتم العثور على وسيط بهذا الكود");
      return;
    }
    router.push(`/lead/${clean}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2.5">
      <input
        className="field text-center tracking-[3px] font-bold uppercase"
        placeholder="كود الوسيط"
        value={code}
        maxLength={6}
        onChange={(e) => setCode(e.target.value)}
        style={{ direction: "ltr" }}
      />
      <button className="btn btn-primary shrink-0" disabled={loading}>
        {loading ? "..." : "متابعة"}
      </button>
      {error && (
        <p className="text-sm w-full mt-1" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </form>
  );
}

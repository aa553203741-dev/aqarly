"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Client } from "@/lib/inventory-types";

export function AddToClientButton({
  unitId,
  className = "btn btn-ghost !py-1.5 !px-3 text-sm",
}: {
  unitId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function openPicker() {
    setOpen(true);
    setMsg("");
    if (!loaded) {
      const supabase = createClient();
      const { data } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      setClients((data as Client[]) ?? []);
      setLoaded(true);
    }
  }

  async function addToClient(clientId: string) {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("client_units")
      .upsert(
        { client_id: clientId, unit_id: unitId, status: "shown" },
        { onConflict: "client_id,unit_id" },
      );
    setBusy(false);
    setMsg(error ? "تعذّر الإضافة" : "✓ أُضيفت للعميل");
    if (!error) setTimeout(() => setOpen(false), 900);
  }

  async function createAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("clients")
      .insert({ name: newName.trim() })
      .select()
      .single();
    if (data) {
      setClients((c) => [data as Client, ...c]);
      setNewName("");
      await addToClient((data as Client).id);
    } else {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={openPicker} className={className}>
        👤 أضف لعميل
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-[380px] p-5 flex flex-col gap-3 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold m-0">إضافة لعميل</h2>
              <button onClick={() => setOpen(false)} className="btn btn-ghost !py-1 !px-3">
                ✕
              </button>
            </div>

            {msg && (
              <p className="text-sm" style={{ color: "var(--brand)" }}>
                {msg}
              </p>
            )}

            <form onSubmit={createAndAdd} className="flex gap-2">
              <input
                className="field"
                placeholder="عميل جديد بالاسم"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button className="btn btn-primary shrink-0" disabled={busy}>
                ＋
              </button>
            </form>

            {!loaded ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>...</p>
            ) : clients.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                لا عملاء بعد — أنشئ واحدًا أعلاه.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => addToClient(c.id)}
                    disabled={busy}
                    className="text-right px-3 py-2 rounded-lg text-sm font-bold"
                    style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}
                  >
                    {c.name}
                    {c.phone ? (
                      <span className="text-xs font-normal" style={{ direction: "ltr" }}>
                        {" "}
                        · {c.phone}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

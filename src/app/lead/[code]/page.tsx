import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadForm } from "@/components/LeadForm";
import { Logo } from "@/components/Logo";

export default async function LeadPage({ params }: PageProps<"/lead/[code]">) {
  const { code } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("lookup_broker_by_code", {
    p_code: code.toUpperCase(),
  });

  const broker = data?.[0];
  if (!broker) notFound();

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10">
      <div className="w-full max-w-[560px]">
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <Logo size={56} withName={false} />
          <h1 className="text-2xl font-extrabold m-0">تقديم طلب عقاري</h1>
          {broker.broker_name && (
            <p className="text-sm m-0" style={{ color: "var(--muted)" }}>
              موجّه إلى الوسيط:{" "}
              <span className="font-bold" style={{ color: "var(--brand)" }}>
                {broker.broker_name}
              </span>
            </p>
          )}
        </div>
        <div className="card p-6">
          <LeadForm
            brokerUserId={broker.user_id}
            brokerName={broker.broker_name ?? ""}
          />
        </div>
      </div>
    </main>
  );
}

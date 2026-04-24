import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EvolutionChart } from "./chart";

export const dynamic = "force-dynamic";

function bucketByDay(
  rows: { consumed_at: string; price: number | null }[],
  days: number
) {
  const today = new Date();
  const buckets: { date: string; count: number; spent: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.push({
      date: d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" }),
      count: 0,
      spent: 0,
    });
    // @ts-expect-error index tmp
    buckets[buckets.length - 1]._key = key;
  }
  for (const r of rows) {
    const key = new Date(r.consumed_at).toISOString().slice(0, 10);
    // @ts-expect-error index tmp
    const b = buckets.find((x) => x._key === key);
    if (b) {
      b.count += 1;
      b.spent += Number(r.price || 0);
    }
  }
  return buckets;
}

export default async function EvolutionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const fromIso = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data: consumptions } = await supabase
    .from("consumptions")
    .select("consumed_at, price")
    .eq("user_id", user.id)
    .gte("consumed_at", fromIso);

  const { data: cravings } = await supabase
    .from("craving_events")
    .select("created_at, resolved")
    .eq("user_id", user.id)
    .gte("created_at", fromIso);

  const daily = bucketByDay(consumptions ?? [], 30);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Évolution</h1>
        <p className="text-ink-600">Ton rythme, sur 30 jours.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Consommations par jour</CardTitle>
        </CardHeader>
        <CardBody>
          <EvolutionChart data={daily} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardBody>
            <div className="text-xs font-medium text-ink-400">CRAVINGS 30J</div>
            <div className="mt-1 text-2xl font-semibold text-clinic-700">
              {cravings?.length ?? 0}
            </div>
            <div className="text-xs text-ink-600">
              dont {(cravings ?? []).filter((c) => c.resolved).length} gérés
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs font-medium text-ink-400">
              DÉPENSES 30J
            </div>
            <div className="mt-1 text-2xl font-semibold text-clinic-700">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(daily.reduce((s, d) => s + d.spent, 0))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

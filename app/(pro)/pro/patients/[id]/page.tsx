import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle, KpiCard } from "@/components/ui/card";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CONSUMPTION_CATEGORIES, GOAL_TYPES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const patientId = params.id;

  const [{ data: profile }, { data: goals }, { data: consumptions }, { data: cravings }] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("display_name, main_goal, baseline_budget_estimate")
        .eq("user_id", patientId)
        .maybeSingle(),
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", patientId)
        .eq("active", true),
      supabase
        .from("consumptions")
        .select("id, consumed_at, category, quantity, price, context, trigger_reason")
        .eq("user_id", patientId)
        .order("consumed_at", { ascending: false })
        .limit(20),
      supabase
        .from("craving_events")
        .select("id, created_at, intensity, resolved")
        .eq("user_id", patientId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const spent7 = (consumptions ?? [])
    .filter((c) => Date.now() - new Date(c.consumed_at).getTime() <= 7 * 86_400_000)
    .reduce((s, c) => s + Number(c.price || 0), 0);

  const goalLabel =
    GOAL_TYPES.find((g) => g.value === profile?.main_goal)?.label ?? "—";

  return (
    <main className="mx-auto max-w-2xl p-6 pb-20">
      <div className="mb-4">
        <Link href="/pro/patients" className="text-sm text-clinic-600">
          ← Tous les patients
        </Link>
      </div>

      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {profile?.display_name ?? "Patient"}
          </h1>
          <p className="text-ink-600 text-sm">Objectif : {goalLabel}</p>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3 mb-4">
        <KpiCard label="Consos 7j" value={(consumptions ?? []).filter(c => Date.now() - new Date(c.consumed_at).getTime() <= 7 * 86_400_000).length} tone="clinic" />
        <KpiCard label="Cravings 7j" value={(cravings ?? []).filter(c => Date.now() - new Date(c.created_at).getTime() <= 7 * 86_400_000).length} tone="coral" />
        <KpiCard label="Dépense 7j" value={formatCurrency(spent7)} tone="mint" />
      </section>

      <section className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Dernières consommations</CardTitle>
          </CardHeader>
          <CardBody>
            {consumptions?.length ? (
              <ul className="divide-y divide-ink-100">
                {consumptions.map((c) => {
                  const cat = CONSUMPTION_CATEGORIES.find(
                    (x) => x.value === c.category
                  );
                  return (
                    <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium">
                          {cat?.emoji} {cat?.label} — {c.quantity} {cat?.unit}
                        </div>
                        <div className="text-xs text-ink-400">
                          {formatDate(c.consumed_at)} · {c.context ?? "—"} ·{" "}
                          {c.trigger_reason ?? "—"}
                        </div>
                      </div>
                      <div className="text-ink-600">
                        {c.price ? formatCurrency(Number(c.price)) : "—"}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-ink-600">Aucune consommation enregistrée.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Derniers cravings</CardTitle>
          </CardHeader>
          <CardBody>
            {cravings?.length ? (
              <ul className="divide-y divide-ink-100">
                {cravings.map((c) => (
                  <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">
                        Intensité {c.intensity}/5{" "}
                        {c.resolved && (
                          <span className="ml-2 text-xs text-mint-700">résolu</span>
                        )}
                      </div>
                      <div className="text-xs text-ink-400">
                        {formatDate(c.created_at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-600">Aucun craving enregistré.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objectifs actifs</CardTitle>
          </CardHeader>
          <CardBody>
            {goals?.length ? (
              <ul className="space-y-2">
                {goals.map((g) => {
                  const label = GOAL_TYPES.find((t) => t.value === g.goal_type)?.label;
                  return (
                    <li
                      key={g.id}
                      className="rounded-2xl border border-ink-100 bg-ink-50 p-3"
                    >
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-ink-600">
                        {g.description || "—"}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-ink-600">Pas d'objectif actif.</p>
            )}
          </CardBody>
        </Card>
      </section>
    </main>
  );
}

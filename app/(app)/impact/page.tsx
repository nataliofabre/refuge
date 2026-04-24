import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("baseline_budget_estimate")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: consumptions } = await supabase
    .from("consumptions")
    .select("price, consumed_at")
    .eq("user_id", user.id);

  const baselineWeek = Number(profile?.baseline_budget_estimate ?? 0);
  const now = Date.now();
  const totalSpentAll = (consumptions ?? []).reduce(
    (s, c) => s + Number(c.price || 0),
    0
  );
  const spent30 = (consumptions ?? [])
    .filter((c) => now - new Date(c.consumed_at).getTime() <= 30 * 86_400_000)
    .reduce((s, c) => s + Number(c.price || 0), 0);

  const monthlyBaseline = baselineWeek * 4.33;
  const saved30 = Math.max(monthlyBaseline - spent30, 0);
  const savedYear = saved30 * 12;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ton impact</h1>
        <p className="text-ink-600">
          Ce que tu gagnes, sans que ce soit une performance.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>💰 Finances</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <Line label="Baseline mensuelle (estimée)" value={formatCurrency(monthlyBaseline)} />
          <Line label="Dépensé sur 30j" value={formatCurrency(spent30)} />
          <Line
            label="Économisé sur 30j"
            value={formatCurrency(saved30)}
            tone="mint"
          />
          <Line
            label="Projection sur un an"
            value={formatCurrency(savedYear)}
            tone="mint"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🌿 Habitudes</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-ink-600">
            Cette section s'enrichira avec la v1 : qualité de sommeil, humeur,
            énergie. Pour l'instant, on te laisse tranquille — pas de note sur
            100, pas de jugement.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⏳ Projections</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-ink-600">
            Si tu gardes ton rythme actuel, tu auras économisé environ{" "}
            <strong>{formatCurrency(savedYear)}</strong> sur l'année. Et c'est
            déjà beaucoup.
          </p>
        </CardBody>
      </Card>

      <p className="text-center text-xs text-ink-400">
        {(consumptions ?? []).length < 3
          ? "Les chiffres deviennent plus parlants après quelques jours d'utilisation."
          : `Calculé à partir de ${consumptions?.length ?? 0} consommations enregistrées.`}
      </p>
    </div>
  );
}

function Line({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: string;
  tone?: "ink" | "mint" | "coral";
}) {
  const color =
    tone === "mint"
      ? "text-mint-700"
      : tone === "coral"
      ? "text-coral-700"
      : "text-ink-800";
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-600">{label}</span>
      <span className={`text-base font-semibold ${color}`}>{value}</span>
    </div>
  );
}

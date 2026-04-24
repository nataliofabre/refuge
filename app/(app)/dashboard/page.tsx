import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle, KpiCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { formatCurrency } from "@/lib/utils";
import { HeartPulse, Wind, Target } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: consumptions }, { data: cravings }] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("display_name, baseline_budget_estimate")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("consumptions")
        .select("id, price, consumed_at")
        .eq("user_id", user.id)
        .gte(
          "consumed_at",
          new Date(Date.now() - 7 * 86_400_000).toISOString()
        ),
      supabase
        .from("craving_events")
        .select("id, resolved, created_at")
        .eq("user_id", user.id)
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 86_400_000).toISOString()
        ),
    ]);

  const consoCount = consumptions?.length ?? 0;
  const spent7 = (consumptions ?? []).reduce(
    (sum, c) => sum + (Number(c.price) || 0),
    0
  );
  const cravingsCount = cravings?.length ?? 0;
  const cravingsResolved = (cravings ?? []).filter((c) => c.resolved).length;

  const baseline = Number(profile?.baseline_budget_estimate ?? 0);
  const saved7 = Math.max(baseline - spent7, 0);

  // Simple streak : jours consécutifs sans conso
  let streak = 0;
  if (consumptions && consumptions.length > 0) {
    const last = new Date(
      Math.max(...consumptions.map((c) => new Date(c.consumed_at).getTime()))
    );
    streak = Math.max(
      0,
      Math.floor((Date.now() - last.getTime()) / 86_400_000)
    );
  } else {
    streak = 7; // fallback encouraging
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <Logo />
        <span className="text-sm text-ink-600">
          {greeting()}, {profile?.display_name ?? "toi"} 👋
        </span>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <KpiCard
          label="Streak sobriété"
          value={`${streak} j`}
          hint="jours sans consommation"
          tone="mint"
        />
        <KpiCard
          label="Économisé (7j)"
          value={formatCurrency(saved7)}
          hint="vs baseline"
          tone="clinic"
        />
        <KpiCard
          label="Consos (7j)"
          value={consoCount}
          hint="enregistrées"
          tone="sand"
        />
        <KpiCard
          label="Cravings gérés"
          value={`${cravingsResolved}/${cravingsCount}`}
          hint="cette semaine"
          tone="coral"
        />
      </section>

      <section className="grid gap-3">
        <Link href="/craving">
          <Card className="hover:border-coral-300 transition">
            <CardBody className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-50 text-coral-700">
                <HeartPulse size={22} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">J'ai un craving</div>
                <div className="text-sm text-ink-600">
                  Respiration, diversion, alternatives — en 1 tap.
                </div>
              </div>
              <span className="text-ink-400">›</span>
            </CardBody>
          </Card>
        </Link>

        <Link href="/log">
          <Card className="hover:border-clinic-300 transition">
            <CardBody className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clinic-50 text-clinic-700">
                <Wind size={22} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">J'ai consommé</div>
                <div className="text-sm text-ink-600">
                  Noter, sans jugement. Ça prend 20 secondes.
                </div>
              </div>
              <span className="text-ink-400">›</span>
            </CardBody>
          </Card>
        </Link>

        <Link href="/goals">
          <Card className="hover:border-mint-300 transition">
            <CardBody className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-50 text-mint-700">
                <Target size={22} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Mes objectifs</div>
                <div className="text-sm text-ink-600">
                  Regarde où tu en es, ajuste si besoin.
                </div>
              </div>
              <span className="text-ink-400">›</span>
            </CardBody>
          </Card>
        </Link>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Ta semaine en un coup d'œil</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-ink-600">
              {consoCount === 0
                ? "Aucune consommation notée cette semaine. Bravo pour avoir tenu le cap 🌱"
                : `Tu as noté ${consoCount} consommation${consoCount > 1 ? "s" : ""} cette semaine. Rien à en conclure — c'est juste un repère.`}
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/evolution" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Voir l'évolution
                </Button>
              </Link>
              <Link href="/impact" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Voir l'impact
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bon matin";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

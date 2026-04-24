"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Chip, Field, Input } from "@/components/ui/input";
import {
  GOAL_TYPES,
  CONSUMPTION_CATEGORIES,
  RISK_MOMENTS,
} from "@/lib/constants";
import { Logo } from "@/components/brand/logo";

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [mainGoal, setMainGoal] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [riskMoments, setRiskMoments] = useState<string[]>([]);
  const [shareWithPro, setShareWithPro] = useState(false);

  function toggle(list: string[], v: string, setter: (v: string[]) => void) {
    setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function finish() {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) {
      router.push("/login");
      return;
    }
    // Ensure public.users row exists
    await supabase.from("users").upsert({
      id: user.id,
      email: user.email!,
      role: "patient",
    });
    await supabase.from("user_profiles").upsert({
      user_id: user.id,
      display_name: displayName || null,
      main_goal: (mainGoal || null) as
        | "risk_reduction"
        | "total_stop"
        | "financial"
        | "sleep"
        | "other"
        | null,
      baseline_consumption_summary: {
        categories,
        frequency,
      },
      baseline_budget_estimate: budget ? Number(budget) : null,
      consent_to_share_data: shareWithPro,
      consent_recorded_at: new Date().toISOString(),
    });
    // Also save a starting goal
    if (mainGoal) {
      await supabase.from("goals").insert({
        user_id: user.id,
        goal_type: mainGoal,
        description: "Objectif défini à l'onboarding",
        active: true,
      });
    }
    await supabase.from("settings").upsert({
      user_id: user.id,
    });
    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <main className="hero-gradient min-h-screen">
      <div className="mx-auto flex max-w-md flex-col gap-8 px-6 pt-8 pb-20">
        <div className="flex items-center justify-between">
          <Logo compact />
          <div className="dot-track">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} data-active={i <= step} />
            ))}
          </div>
        </div>

        {step === 0 && (
          <StepShell
            title="Comment on t'appelle ?"
            subtitle="Un prénom ou un pseudo — ce que tu veux. Tu pourras changer."
          >
            <Field label="Prénom ou pseudo">
              <Input
                placeholder="Ex : Alex"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Field>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell
            title="Quel est ton objectif principal ?"
            subtitle="Pas d'obligation de viser « zéro ». Choisis ce qui te parle."
          >
            <div className="flex flex-col gap-2">
              {GOAL_TYPES.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setMainGoal(g.value)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    mainGoal === g.value
                      ? "border-clinic-500 bg-clinic-50"
                      : "border-ink-200 bg-white hover:bg-ink-50"
                  }`}
                >
                  <div className="font-medium">{g.label}</div>
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            title="Qu'est-ce que tu veux suivre ?"
            subtitle="Plusieurs choix possibles."
          >
            <div className="flex flex-wrap gap-2">
              {CONSUMPTION_CATEGORIES.map((c) => (
                <Chip
                  key={c.value}
                  active={categories.includes(c.value)}
                  onClick={() => toggle(categories, c.value, setCategories)}
                >
                  {c.emoji} {c.label}
                </Chip>
              ))}
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell
            title="Ta fréquence actuelle ?"
            subtitle="Une estimation suffit. C'est un point de départ, pas un jugement."
          >
            <div className="flex flex-col gap-2">
              {[
                "Tous les jours",
                "Plusieurs fois par semaine",
                "Une fois par semaine",
                "Quelques fois par mois",
                "Rarement",
              ].map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    frequency === f
                      ? "border-clinic-500 bg-clinic-50"
                      : "border-ink-200 bg-white hover:bg-ink-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell
            title="Ton budget actuel moyen ?"
            subtitle="Par semaine. Tu pourras affiner plus tard."
          >
            <Field label="En €/semaine">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Ex : 40"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </Field>
          </StepShell>
        )}

        {step === 5 && (
          <StepShell
            title="Tes moments à risque"
            subtitle="Choisis tous ceux qui te parlent."
          >
            <div className="flex flex-wrap gap-2">
              {RISK_MOMENTS.map((m) => (
                <Chip
                  key={m}
                  active={riskMoments.includes(m)}
                  onClick={() => toggle(riskMoments, m, setRiskMoments)}
                >
                  {m}
                </Chip>
              ))}
            </div>
          </StepShell>
        )}

        {step === 6 && (
          <StepShell
            title="Partager avec un pro ?"
            subtitle="Tu peux décider plus tard. Par défaut, tes données restent privées."
          >
            <label className="flex items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={shareWithPro}
                onChange={(e) => setShareWithPro(e.target.checked)}
                className="mt-1 h-5 w-5"
              />
              <div>
                <div className="font-medium">
                  J'accepte de partager mon suivi avec un psychiatre ou un
                  professionnel.
                </div>
                <div className="text-sm text-ink-600 mt-1">
                  Tu pourras lui envoyer un code d'accès quand tu voudras —
                  et retirer ce partage à tout moment.
                </div>
              </div>
            </label>
          </StepShell>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex-1"
            >
              Retour
            </Button>
          )}
          {step < 6 ? (
            <Button
              size="lg"
              onClick={() => setStep((s) => (s + 1) as Step)}
              className="flex-1"
              disabled={
                (step === 1 && !mainGoal) ||
                (step === 2 && categories.length === 0)
              }
            >
              Continuer
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={finish}
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Terminer"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-ink-600">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

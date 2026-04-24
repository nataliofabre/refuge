"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EMERGENCY_CONTACTS } from "@/lib/constants";
import { Wind, Phone, CheckCircle2, RotateCcw } from "lucide-react";

type Step = "start" | "breath" | "divert" | "resolved";

export default function CravingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("start");
  const [intensity, setIntensity] = useState<number>(3);
  const [context, setContext] = useState<string>("");
  const [eventId, setEventId] = useState<string | null>(null);

  async function startCraving() {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) return;
    const { data, error } = await supabase
      .from("craving_events")
      .insert({
        user_id: user.id,
        intensity,
        context: context || null,
      })
      .select("id")
      .single();
    if (!error && data) setEventId(data.id);
    setStep("breath");
  }

  async function resolveCraving(action: string, resolved: boolean) {
    if (eventId) {
      await supabase
        .from("craving_events")
        .update({
          action_taken: action,
          resolved,
          resolved_at: resolved ? new Date().toISOString() : null,
        })
        .eq("id", eventId);
    }
    setStep("resolved");
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-coral-700">
          Craving — on respire, on regarde.
        </h1>
        <p className="text-ink-600">
          Ça va passer. Tu n'as rien à prouver, on y va ensemble.
        </p>
      </header>

      {step === "start" && (
        <Card>
          <CardBody className="flex flex-col gap-5">
            <div>
              <div className="text-sm font-medium">Intensité</div>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setIntensity(n)}
                    className={`flex h-12 flex-1 items-center justify-center rounded-2xl border text-lg font-semibold transition ${
                      intensity === n
                        ? "border-coral-500 bg-coral-50 text-coral-700"
                        : "border-ink-200 bg-white text-ink-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-xs text-ink-400">
                1 = léger · 5 = très fort
              </div>
            </div>

            <div>
              <div className="text-sm font-medium">Contexte (optionnel)</div>
              <input
                className="mt-2 h-11 w-full rounded-2xl border border-ink-200 bg-white px-4"
                placeholder="Ex : soir, après le travail, seul·e"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>

            <Button size="lg" variant="coral" onClick={startCraving}>
              Commencer l'exercice de respiration
            </Button>
          </CardBody>
        </Card>
      )}

      {step === "breath" && (
        <BreathingBox onDone={() => setStep("divert")} />
      )}

      {step === "divert" && (
        <div className="grid gap-3">
          <Card>
            <CardBody>
              <div className="text-sm font-medium text-ink-600 mb-2">
                Essaye une alternative rapide :
              </div>
              <div className="grid gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    resolveCraving("marche 5 min", true)
                  }
                >
                  🚶 Marcher 5 minutes
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    resolveCraving("eau + fruit", true)
                  }
                >
                  💧 Grand verre d'eau + fruit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    resolveCraving("appel proche", true)
                  }
                >
                  📞 Appeler un·e proche
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    resolveCraving("douche froide", true)
                  }
                >
                  🚿 Douche tiède / froide
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-sm font-medium mb-2">
                Besoin d'aide tout de suite ?
              </div>
              <div className="grid gap-2">
                {EMERGENCY_CONTACTS.map((c) => (
                  <a
                    key={c.tel}
                    href={`tel:${c.tel}`}
                    className="flex items-center justify-between rounded-2xl border border-ink-200 bg-white px-4 py-3 hover:bg-ink-50"
                  >
                    <span className="text-sm font-medium">{c.name}</span>
                    <Phone size={18} className="text-clinic-600" />
                  </a>
                ))}
              </div>
            </CardBody>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="lg"
              className="flex-1"
              onClick={() => resolveCraving("non résolu", false)}
            >
              Je n'y arrive pas
            </Button>
          </div>
        </div>
      )}

      {step === "resolved" && (
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 size={48} className="text-mint-500" />
            <div className="text-center">
              <div className="text-xl font-semibold">Bravo.</div>
              <div className="text-ink-600 mt-1">
                Chaque craving traversé est une petite victoire.
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setStep("start");
                  setEventId(null);
                  setIntensity(3);
                  setContext("");
                }}
              >
                <RotateCcw size={16} /> Recommencer
              </Button>
              <Button
                className="flex-1"
                onClick={() => router.push("/dashboard")}
              >
                Retour
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function BreathingBox({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = Date.now();
    function tick() {
      const elapsed = (Date.now() - start) / 1000;
      setSecondsLeft(Math.max(0, 60 - Math.floor(elapsed)));
      const inCycle = elapsed % 10;
      if (inCycle < 4) setPhase("inhale");
      else if (inCycle < 5) setPhase("hold");
      else setPhase("exhale");
      if (elapsed < 60) rafRef.current = requestAnimationFrame(tick);
    }
    tick();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const scale =
    phase === "inhale" ? 1.3 : phase === "hold" ? 1.3 : 0.9;

  return (
    <Card>
      <CardBody className="flex flex-col items-center gap-6 py-10">
        <div className="relative flex h-56 w-56 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full bg-clinic-100 transition-transform duration-[4000ms] ease-in-out"
            style={{ transform: `scale(${scale})` }}
          />
          <div className="relative z-10 text-center">
            <div className="text-2xl font-semibold text-clinic-700">
              {phase === "inhale"
                ? "Inspire"
                : phase === "hold"
                ? "Retiens"
                : "Expire"}
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-ink-600">
              <Wind size={14} /> {secondsLeft}s
            </div>
          </div>
        </div>
        <Button size="lg" onClick={onDone} disabled={secondsLeft > 0}>
          {secondsLeft > 0 ? `Continue ${secondsLeft}s` : "Et après ?"}
        </Button>
      </CardBody>
    </Card>
  );
}

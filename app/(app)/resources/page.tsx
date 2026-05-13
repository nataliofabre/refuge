"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, ChevronDown, Wind, Sparkles, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EMERGENCY_CONTACTS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

function formatMMSS(totalSeconds: number) {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const mm = Math.floor(safe / 60).toString().padStart(2, "0");
  const ss = (safe % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

type Tone = "clinic" | "mint" | "sand" | "coral";

type BreathingPattern = {
  key: string;
  title: string;
  emoji: string;
  desc: string;
  recommended: string;
  durationMinutes: number;
  cycle: { label: string; seconds: number }[];
  tone: Tone;
  shape: "circle" | "square";
};

const breathingPatterns: BreathingPattern[] = [
  {
    key: "breath-46",
    title: "Respiration 4-6 (1 min)",
    emoji: "🫁",
    desc: "Inspire 4s, expire 6s. Le classique pour faire redescendre rapidement.",
    recommended: "Calmer une montée de pression en 1 minute",
    durationMinutes: 1,
    cycle: [
      { label: "Inspire", seconds: 4 },
      { label: "Expire", seconds: 6 },
    ],
    tone: "clinic",
    shape: "circle",
  },
  {
    key: "breath-coherence",
    title: "Cohérence cardiaque (5 min)",
    emoji: "💗",
    desc: "5 secondes inspire, 5 secondes expire. 6 respirations par minute.",
    recommended: "Réguler le stress de fond, matin ou soir",
    durationMinutes: 5,
    cycle: [
      { label: "Inspire", seconds: 5 },
      { label: "Expire", seconds: 5 },
    ],
    tone: "mint",
    shape: "circle",
  },
  {
    key: "breath-478",
    title: "4-7-8 — relaxation (2 min)",
    emoji: "🌙",
    desc: "Inspire 4s, retiens 7s, expire 8s. Ralentit fortement le système nerveux.",
    recommended: "Anxiété forte, ou avant de dormir",
    durationMinutes: 2,
    cycle: [
      { label: "Inspire", seconds: 4 },
      { label: "Retiens", seconds: 7 },
      { label: "Expire", seconds: 8 },
    ],
    tone: "sand",
    shape: "circle",
  },
  {
    key: "breath-box",
    title: "Box breathing 4-4-4-4 (2 min)",
    emoji: "⬛",
    desc: "Inspire, retiens, expire, retiens — 4s chaque. Trace un carré.",
    recommended: "Retrouver de la concentration avant un moment important",
    durationMinutes: 2,
    cycle: [
      { label: "Inspire", seconds: 4 },
      { label: "Retiens", seconds: 4 },
      { label: "Expire", seconds: 4 },
      { label: "Retiens", seconds: 4 },
    ],
    tone: "clinic",
    shape: "square",
  },
];

type OtherExercise = {
  key: string;
  title: string;
  emoji: string;
  desc: string;
  steps?: string[];
  timerSeconds?: number;
  noteField?: boolean;
};

const otherExercises: OtherExercise[] = [
  {
    key: "walk",
    title: "Sortie express (10 min)",
    emoji: "🚶",
    desc: "Marche 10 min, sans téléphone si possible.",
    steps: [
      "Mets une tenue confortable et des chaussures.",
      "Sors sans ton téléphone (ou en mode silencieux dans la poche).",
      "Marche à un rythme normal pendant 10 minutes.",
      "Observe : la rue, les sons, ta respiration.",
      "À la fin, réévalue : est-ce que l'envie a bougé ?",
    ],
    timerSeconds: 10 * 60,
  },
  {
    key: "water",
    title: "Eau + fruit (15 min)",
    emoji: "💧",
    desc: "Grand verre d'eau, un fruit, 15 min d'attente.",
    steps: [
      "Bois un grand verre d'eau, lentement.",
      "Mange un fruit (ou un truc sucré naturel).",
      "Lance le timer de 15 minutes.",
      "Pendant l'attente, fais autre chose : musique, série, douche.",
      "Quand le timer sonne, réévalue : l'envie est-elle encore là ?",
    ],
    timerSeconds: 15 * 60,
  },
  {
    key: "deferred",
    title: "Envies différées",
    emoji: "📝",
    desc: "Écris 3 choses que tu aimerais faire à la place. Transforme la pulsion en intention.",
    noteField: true,
  },
];

type Read = {
  key: string;
  title: string;
  emoji: string;
  desc: string;
  body: string;
};

const reads: Read[] = [
  {
    key: "craving",
    title: "Comprendre le craving",
    emoji: "📖",
    desc: "Le craving est une vague. Elle monte, elle retombe — même sans rien faire.",
    body: `Le craving, c'est cette envie intense et soudaine de consommer. Il monte vite, il fait peur — mais c'est une vague : il monte, il atteint un pic (en général entre 5 et 20 minutes), puis il redescend tout seul, même si tu ne fais rien.

Le piège, c'est de croire qu'il va durer pour toujours, ou qu'il va te submerger. Du coup, on cède pour "que ça s'arrête". Mais en cédant, on apprend à son cerveau que céder = soulagement, et le craving devient plus fréquent.

À l'inverse, si tu "surfes" la vague — tu observes, tu respires, tu laisses passer — ton cerveau apprend que le craving passe, et la fois suivante il sera moins fort.

Ce qui aide vraiment : repérer le craving dès qu'il monte (pas attendre qu'il soit à 9/10), bouger physiquement, boire de l'eau, et noter ce qui l'a déclenché. Tu construis tes données — et avec le temps, tu vois tes patterns.`,
  },
  {
    key: "harm-reduction",
    title: "Réduction des risques",
    emoji: "🛡️",
    desc: "Arrêter n'est pas le seul objectif valable. Réduire aussi.",
    body: `On entend souvent qu'il faut "arrêter" — comme si c'était zéro ou rien. La réalité, c'est qu'entre une consommation problématique et l'abstinence totale, il y a tout un terrain de jeu où on peut beaucoup gagner en santé, en argent, en relations, en clarté.

Réduction des risques, c'est : viser moins fort, moins souvent, dans des contextes plus sûrs. Boire 3 verres au lieu de 7. Ne pas mélanger alcool et médicaments. Manger avant de boire. S'hydrater pendant. Ne pas conduire. Identifier ses moments à risque pour les anticiper.

C'est un objectif complètement valable, soutenu par la recherche médicale, et souvent plus tenable au long cours qu'une abstinence radicale qui craque au bout de 3 semaines.

Si à terme tu veux arrêter complètement, super — la réduction peut être une étape. Si tu veux juste mieux gérer, c'est super aussi. Tu choisis.`,
  },
  {
    key: "talk",
    title: "Parler à son entourage",
    emoji: "🤝",
    desc: "Comment expliquer ton objectif à tes proches sans te justifier.",
    body: `Quand tu changes ta consommation, ton entourage peut réagir bizarrement : insister ("juste un verre, allez"), te juger ("tu fais une cure ?"), s'inquiéter, ou au contraire ne rien remarquer du tout. C'est normal et c'est pas contre toi.

Quelques phrases utiles :
— "Je fais une pause / je réduis, en ce moment ça me fait du bien."
— "Je préfère ne pas en parler ce soir, je profite juste de la soirée."
— "Merci de ne pas insister, ça m'aide vraiment."

Tu n'as pas besoin de tout expliquer, ni d'avoir un objectif spectaculaire à raconter. "Je teste un truc" suffit. Les gens qui te respectent vont s'adapter ; ceux qui insistent ou se moquent te disent quelque chose d'intéressant sur la relation.

Allié·e clé : si possible, identifie une personne (ami, partenaire, frère/sœur) qui sera dans la confidence et que tu pourras appeler quand c'est dur. Pas besoin que ce soit un pro — juste quelqu'un qui ne juge pas.`,
  },
];

type LogEntry = {
  id: string;
  exercise_key: string;
  exercise_title: string | null;
  completed: boolean;
  payload: any;
  created_at: string;
};

const toneClasses: Record<Tone, { bg: string; border: string; text: string; ring: string }> = {
  clinic: {
    bg: "bg-clinic-100",
    border: "border-clinic-300",
    text: "text-clinic-700",
    ring: "ring-clinic-300",
  },
  mint: {
    bg: "bg-mint-50",
    border: "border-mint-300",
    text: "text-mint-700",
    ring: "ring-mint-300",
  },
  sand: {
    bg: "bg-sand-50",
    border: "border-sand-200",
    text: "text-sand-500",
    ring: "ring-sand-200",
  },
  coral: {
    bg: "bg-coral-50",
    border: "border-coral-300",
    text: "text-coral-700",
    ring: "ring-coral-300",
  },
};

export default function ResourcesPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [cravingWeek, setCravingWeek] = useState<number>(0);
  const [exerciseWeek, setExerciseWeek] = useState<number>(0);

  const supabase = createClient();

  async function loadHistoryAndStats() {
    try {
      const { data } = await supabase
        .from("user_exercise_logs")
        .select("id, exercise_key, exercise_title, completed, payload, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      setHistory((data as LogEntry[]) || []);

      const sinceISO = new Date(Date.now() - 7 * 86_400_000).toISOString();

      const { count: exCount } = await supabase
        .from("user_exercise_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sinceISO);
      setExerciseWeek(exCount || 0);

      const { count: crCount } = await supabase
        .from("craving_events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sinceISO);
      setCravingWeek(crCount || 0);
    } catch (e) {
      // table peut ne pas encore exister si le SQL n'a pas été exécuté
      console.warn("Resources: history not available yet", e);
    }
  }

  useEffect(() => {
    loadHistoryAndStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logExercise(
    exerciseKey: string,
    exerciseTitle: string,
    payload?: any
  ) {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) return;
      await supabase.from("user_exercise_logs").insert({
        user_id: user.id,
        exercise_key: exerciseKey,
        exercise_title: exerciseTitle,
        completed: true,
        completed_at: new Date().toISOString(),
        payload: payload ?? null,
      });
      await loadHistoryAndStats();
    } catch (e) {
      console.warn("Could not save exercise log", e);
    }
  }

  async function deleteEntry(id: string) {
    try {
      await supabase.from("user_exercise_logs").delete().eq("id", id);
      await loadHistoryAndStats();
    } catch (e) {
      console.warn("Could not delete entry", e);
    }
  }

  const toggle = (k: string) => setOpenKey(openKey === k ? null : k);

  const deferredHistory = history.filter((h) => h.exercise_key === "deferred");

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ressources</h1>
        <p className="text-ink-600">
          Des outils concrets, quand tu en as besoin. Clique sur une carte pour
          l'ouvrir.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>🌬️ Respirations guidées</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-2">
          {breathingPatterns.map((p) => (
            <BreathingCard
              key={p.key}
              pattern={p}
              open={openKey === p.key}
              onToggle={() => toggle(p.key)}
              onComplete={() => logExercise(p.key, p.title)}
            />
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🎯 Autres exercices</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-2">
          {otherExercises.map((e) => (
            <ExerciseCard
              key={e.key}
              ex={e}
              open={openKey === e.key}
              onToggle={() => toggle(e.key)}
              onComplete={(payload) => logExercise(e.key, e.title, payload)}
            />
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📚 À lire</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-2">
          {reads.map((r) => (
            <ReadCard
              key={r.key}
              read={r}
              open={openKey === r.key}
              onToggle={() => toggle(r.key)}
            />
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📒 Mon journal — 7 derniers jours</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Cravings traversés"
              value={cravingWeek}
              tone="coral"
            />
            <StatTile
              label="Exercices faits"
              value={exerciseWeek}
              tone="mint"
            />
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-ink-700">
              Mes envies différées récentes
            </div>
            {deferredHistory.length === 0 ? (
              <p className="text-sm text-ink-500">
                Rien pour l'instant. Quand tu remplis l'exercice "Envies
                différées" et que tu cliques sur Enregistrer, tu retrouves tes
                idées ici.
              </p>
            ) : (
              <ul className="space-y-2">
                {deferredHistory.map((h) => {
                  const ideas: string[] = Array.isArray(h.payload?.ideas)
                    ? h.payload.ideas.filter((x: string) => x && x.trim())
                    : [];
                  return (
                    <li
                      key={h.id}
                      className="rounded-2xl border border-ink-100 bg-white p-3"
                    >
                      <div className="mb-1 flex items-start justify-between text-xs text-ink-400">
                        <span>{formatDate(h.created_at)}</span>
                        <button
                          onClick={() => deleteEntry(h.id)}
                          className="text-ink-400 hover:text-coral-600"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {ideas.length > 0 ? (
                        <ul className="list-disc pl-5 text-sm text-ink-700">
                          {ideas.map((i, idx) => (
                            <li key={idx}>{i}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-ink-500">
                          (Aucune idée notée)
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>☎️ Aide urgente</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-2">
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
        </CardBody>
      </Card>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Tone;
}) {
  const c = toneClasses[tone];
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-4`}>
      <div className={`text-3xl font-semibold ${c.text}`}>{value}</div>
      <div className="text-xs text-ink-700">{label}</div>
    </div>
  );
}

function BreathingCard({
  pattern,
  open,
  onToggle,
  onComplete,
}: {
  pattern: BreathingPattern;
  open: boolean;
  onToggle: () => void;
  onComplete: () => void;
}) {
  const c = toneClasses[pattern.tone];

  return (
    <div
      className={`rounded-2xl border bg-white transition ${
        open ? c.border : "border-ink-200"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-ink-50"
      >
        <span className="text-2xl">{pattern.emoji}</span>
        <div className="flex-1">
          <div className="font-medium">{pattern.title}</div>
          <div className="text-sm text-ink-600">{pattern.desc}</div>
          <div className={`mt-1 text-xs ${c.text}`}>
            ↳ {pattern.recommended}
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-ink-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-ink-100 p-4">
          <BreathingExercise pattern={pattern} onComplete={onComplete} />
        </div>
      )}
    </div>
  );
}

function BreathingExercise({
  pattern,
  onComplete,
}: {
  pattern: BreathingPattern;
  onComplete: () => void;
}) {
  const totalSeconds = pattern.durationMinutes * 60;
  const cycleSeconds = pattern.cycle.reduce((s, p) => s + p.seconds, 0);

  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseT, setPhaseT] = useState(0); // 0..1 in current phase
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [done, setDone] = useState(false);
  const rafRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    setSecondsLeft(totalSeconds);
    setDone(false);
    completedRef.current = false;

    function tick() {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, totalSeconds - elapsed);
      setSecondsLeft(Math.ceil(left));

      const inCycle = elapsed % cycleSeconds;
      let acc = 0;
      let pIdx = 0;
      for (let i = 0; i < pattern.cycle.length; i++) {
        if (inCycle < acc + pattern.cycle[i].seconds) {
          pIdx = i;
          break;
        }
        acc += pattern.cycle[i].seconds;
      }
      const pT = (inCycle - acc) / pattern.cycle[pIdx].seconds;
      setPhaseIdx(pIdx);
      setPhaseT(pT);

      if (elapsed < totalSeconds) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setRunning(false);
        setDone(true);
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      }
    }
    tick();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const phaseLabel = pattern.cycle[phaseIdx].label;
  const c = toneClasses[pattern.tone];

  if (!running && !done) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <p className="text-sm text-ink-600">
          {pattern.durationMinutes} min · cycle{" "}
          {pattern.cycle.map((p) => `${p.seconds}s ${p.label.toLowerCase()}`).join(" → ")}
        </p>
        <Button onClick={() => setRunning(true)}>Démarrer</Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Sparkles size={28} className={c.text} />
        <p className="text-sm font-medium text-mint-700">
          Bravo 🎉 — exercice enregistré dans ton journal.
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setDone(false);
            setSecondsLeft(totalSeconds);
            setRunning(true);
          }}
        >
          Recommencer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {pattern.shape === "circle" ? (
        <CircleVisual
          phaseLabel={phaseLabel}
          phaseIdx={phaseIdx}
          phaseT={phaseT}
          tone={pattern.tone}
        />
      ) : (
        <SquareVisual
          phaseLabel={phaseLabel}
          phaseIdx={phaseIdx}
          phaseT={phaseT}
          tone={pattern.tone}
        />
      )}
      <div className="flex items-center justify-center gap-2 text-sm text-ink-600">
        <Wind size={14} />
        <span className="text-base font-semibold tabular-nums text-ink-800">
          {formatMMSS(secondsLeft)}
        </span>
        <span className="text-xs text-ink-400">restantes</span>
      </div>
      <button
        onClick={() => {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          setRunning(false);
          setSecondsLeft(totalSeconds);
        }}
        className="text-sm text-ink-500 underline"
      >
        Arrêter
      </button>
    </div>
  );
}

function CircleVisual({
  phaseLabel,
  phaseIdx,
  phaseT,
  tone,
}: {
  phaseLabel: string;
  phaseIdx: number;
  phaseT: number;
  tone: Tone;
}) {
  const c = toneClasses[tone];
  // Smooth ease (sinusoid) for breathing feel
  const ease = (1 - Math.cos(Math.PI * phaseT)) / 2;

  let scale = 0.85;
  const lower = phaseLabel.toLowerCase();
  if (lower.startsWith("inspire")) {
    scale = 0.85 + 0.45 * ease;
  } else if (lower.startsWith("expire")) {
    scale = 1.3 - 0.45 * ease;
  } else {
    // Retiens (hold). If the hold comes right after Inspire, the lung is "full" → big.
    // If the hold comes right after Expire (box breathing), it's "empty" → small.
    // Heuristic: phaseIdx 1 = first hold (after Inspire) → big.
    //            phaseIdx 3 = second hold (after Expire) → small.
    scale = phaseIdx === 1 ? 1.3 : 0.85;
  }

  return (
    <div className="relative flex h-56 w-56 items-center justify-center">
      <div
        className={`absolute inset-0 rounded-full ${c.bg}`}
        style={{ transform: `scale(${scale})` }}
      />
      <div
        className={`absolute inset-3 rounded-full ring-2 ${c.ring}`}
        style={{ transform: `scale(${scale * 0.85})`, opacity: 0.5 }}
      />
      <div className="relative z-10 text-center">
        <div className={`text-2xl font-semibold ${c.text}`}>{phaseLabel}</div>
      </div>
    </div>
  );
}

function SquareVisual({
  phaseLabel,
  phaseIdx,
  phaseT,
  tone,
}: {
  phaseLabel: string;
  phaseIdx: number;
  phaseT: number;
  tone: Tone;
}) {
  const c = toneClasses[tone];
  const SIZE = 224; // px
  const INSET = 12;
  const min = INSET;
  const max = SIZE - INSET;

  // Dot tracing along 4 sides. Box cycle: Inspire → Retiens → Expire → Retiens
  let dotX = min;
  let dotY = max;
  if (phaseIdx === 0) {
    // Inspire: bottom-left → top-left (going up the left side)
    dotX = min;
    dotY = max - (max - min) * phaseT;
  } else if (phaseIdx === 1) {
    // Hold full: top-left → top-right
    dotX = min + (max - min) * phaseT;
    dotY = min;
  } else if (phaseIdx === 2) {
    // Expire: top-right → bottom-right
    dotX = max;
    dotY = min + (max - min) * phaseT;
  } else {
    // Hold empty: bottom-right → bottom-left
    dotX = max - (max - min) * phaseT;
    dotY = max;
  }

  // Fill level for visual support (rises during inhale, full during hold, falls during exhale, empty during hold)
  let fill = 0;
  if (phaseIdx === 0) fill = phaseT;
  else if (phaseIdx === 1) fill = 1;
  else if (phaseIdx === 2) fill = 1 - phaseT;
  else fill = 0;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border-2 border-ink-100 bg-white"
      style={{ width: SIZE, height: SIZE }}
    >
      <div
        className={`absolute inset-x-0 bottom-0 ${c.bg}`}
        style={{ height: `${fill * 100}%` }}
      />
      <div
        className={`absolute h-4 w-4 rounded-full ${c.bg} border-2 ${c.border} shadow-soft`}
        style={{ left: dotX - 8, top: dotY - 8 }}
      />
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <div className={`text-2xl font-semibold ${c.text}`}>{phaseLabel}</div>
      </div>
    </div>
  );
}

function ExerciseCard({
  ex,
  open,
  onToggle,
  onComplete,
}: {
  ex: OtherExercise;
  open: boolean;
  onToggle: () => void;
  onComplete: (payload?: any) => void;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white transition ${
        open ? "border-clinic-300" : "border-ink-200"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-ink-50"
      >
        <span className="text-2xl">{ex.emoji}</span>
        <div className="flex-1">
          <div className="font-medium">{ex.title}</div>
          <div className="text-sm text-ink-600">{ex.desc}</div>
        </div>
        <ChevronDown
          size={18}
          className={`text-ink-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-ink-100 p-4">
          {ex.steps && (
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-700">
              {ex.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
          {ex.timerSeconds && (
            <Timer
              totalSeconds={ex.timerSeconds}
              onDone={() => onComplete()}
            />
          )}
          {ex.noteField && <DeferredNotes onSave={(ideas) => onComplete({ ideas })} />}
        </div>
      )}
    </div>
  );
}

function Timer({
  totalSeconds,
  onDone,
}: {
  totalSeconds: number;
  onDone: () => void;
}) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      setRunning(false);
      setDone(true);
      if (!completedRef.current) {
        completedRef.current = true;
        onDone();
      }
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, remaining]);

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <div className="text-2xl font-semibold tabular-nums text-clinic-700">
        {mm}:{ss}
      </div>
      {done ? (
        <span className="text-sm font-medium text-mint-700">
          Bravo 🎉 — enregistré dans ton journal.
        </span>
      ) : (
        <Button
          size="sm"
          variant={running ? "secondary" : "primary"}
          onClick={() => {
            if (remaining === 0) {
              setRemaining(totalSeconds);
              setDone(false);
              completedRef.current = false;
            }
            setRunning((r) => !r);
          }}
        >
          {running ? "Pause" : remaining < totalSeconds ? "Reprendre" : "Démarrer"}
        </Button>
      )}
      {(running || (remaining < totalSeconds && !done)) && (
        <button
          onClick={() => {
            setRunning(false);
            setRemaining(totalSeconds);
            setDone(false);
            completedRef.current = false;
          }}
          className="text-sm text-ink-500 underline"
        >
          Reset
        </button>
      )}
    </div>
  );
}

function DeferredNotes({ onSave }: { onSave: (ideas: string[]) => void }) {
  const [notes, setNotes] = useState<string[]>(["", "", ""]);
  const [saved, setSaved] = useState(false);

  const filled = notes.some((n) => n.trim().length > 0);

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm text-ink-600">
        3 choses que tu aimerais faire à la place, là, maintenant :
      </p>
      {notes.map((n, i) => (
        <input
          key={i}
          value={n}
          onChange={(e) =>
            setNotes(notes.map((x, idx) => (idx === i ? e.target.value : x)))
          }
          placeholder={`Idée ${i + 1}`}
          className="w-full rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm"
        />
      ))}
      {saved ? (
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-mint-700">
            ✓ Enregistré dans ton journal.
          </span>
          <button
            onClick={() => {
              setNotes(["", "", ""]);
              setSaved(false);
            }}
            className="text-sm text-clinic-600 underline"
          >
            Nouvelle entrée
          </button>
        </div>
      ) : (
        <Button
          size="sm"
          disabled={!filled}
          onClick={() => {
            onSave(notes);
            setSaved(true);
          }}
        >
          Enregistrer dans mon journal
        </Button>
      )}
    </div>
  );
}

function ReadCard({
  read,
  open,
  onToggle,
}: {
  read: Read;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white transition ${
        open ? "border-clinic-300" : "border-ink-100"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-ink-50"
      >
        <span className="text-2xl">{read.emoji}</span>
        <div className="flex-1">
          <div className="font-medium">{read.title}</div>
          <div className="text-sm text-ink-600">{read.desc}</div>
        </div>
        <ChevronDown
          size={18}
          className={`text-ink-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="whitespace-pre-line border-t border-ink-100 p-4 text-sm leading-relaxed text-ink-700">
          {read.body}
        </div>
      )}
    </div>
  );
}

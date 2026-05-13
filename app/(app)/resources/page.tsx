"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, ChevronDown } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EMERGENCY_CONTACTS } from "@/lib/constants";

type Exercise = {
  key: string;
  title: string;
  emoji: string;
  desc: string;
  href?: string;
  steps?: string[];
  timerSeconds?: number;
  noteField?: boolean;
};

const exercises: Exercise[] = [
  {
    key: "breathing",
    title: "Respiration 4-6 (1 min)",
    emoji: "🫁",
    desc: "Inspire 4 sec, expire 6 sec. Le classique pour faire redescendre la pression.",
    href: "/craving",
  },
  {
    key: "walk",
    title: "Sortie express (10 min)",
    emoji: "🚶",
    desc: "Marche 10 min, sans téléphone si possible. Aussi simple que ça.",
    steps: [
      "Mets une tenue confortable et des chaussures.",
      "Sors sans ton téléphone (ou en mode silencieux au fond de la poche).",
      "Marche à un rythme normal pendant 10 minutes.",
      "Observe : la rue, les sons, ta respiration. Pas besoin de penser à autre chose.",
      "À la fin, réévalue : est-ce que l'envie a bougé ?",
    ],
    timerSeconds: 10 * 60,
  },
  {
    key: "water",
    title: "Eau + fruit (15 min)",
    emoji: "💧",
    desc: "Grand verre d'eau, un fruit. Attends 15 min — souvent l'envie redescend toute seule.",
    steps: [
      "Bois un grand verre d'eau, lentement.",
      "Mange un fruit (ou un truc sucré naturel).",
      "Lance le timer de 15 minutes.",
      "Pendant l'attente, fais autre chose : musique, série, douche, ménage.",
      "Quand le timer sonne, réévalue : l'envie est encore là, ou pas ?",
    ],
    timerSeconds: 15 * 60,
  },
  {
    key: "deferred",
    title: "Envies différées",
    emoji: "📝",
    desc: "Écris 3 choses que tu aimerais faire à la place. Ça transforme la pulsion en intention.",
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

Ce qui aide vraiment : repérer le craving dès qu'il monte (pas attendre qu'il soit à 9/10), bouger physiquement (marche, douche froide), boire de l'eau, et noter ce qui l'a déclenché. Tu construis tes données — et avec le temps, tu vois tes patterns.`,
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

export default function ResourcesPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const toggle = (k: string) => setOpenKey(openKey === k ? null : k);

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
          <CardTitle>🎯 Exercices rapides</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-2">
          {exercises.map((e) => (
            <ExerciseCard
              key={e.key}
              ex={e}
              open={openKey === e.key}
              onToggle={() => toggle(e.key)}
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

function ExerciseCard({
  ex,
  open,
  onToggle,
}: {
  ex: Exercise;
  open: boolean;
  onToggle: () => void;
}) {
  if (ex.href) {
    return (
      <Link
        href={ex.href}
        className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 hover:bg-ink-50"
      >
        <span className="text-2xl">{ex.emoji}</span>
        <div className="flex-1">
          <div className="font-medium">{ex.title}</div>
          <div className="text-sm text-ink-600">{ex.desc}</div>
        </div>
        <span className="text-ink-400">›</span>
      </Link>
    );
  }

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

          {ex.timerSeconds && <Timer totalSeconds={ex.timerSeconds} />}

          {ex.noteField && <DeferredNotes />}
        </div>
      )}
    </div>
  );
}

function Timer({ totalSeconds }: { totalSeconds: number }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      setRunning(false);
      setDone(true);
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [running, remaining]);

  const mm = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <div className="text-2xl font-semibold tabular-nums text-clinic-700">
        {mm}:{ss}
      </div>
      {done ? (
        <span className="text-sm font-medium text-mint-700">
          Bravo 🎉 — l'envie a-t-elle bougé ?
        </span>
      ) : (
        <Button
          size="sm"
          variant={running ? "secondary" : "primary"}
          onClick={() => {
            if (remaining === 0) {
              setRemaining(totalSeconds);
              setDone(false);
            }
            setRunning((r) => !r);
          }}
        >
          {running
            ? "Pause"
            : remaining < totalSeconds
            ? "Reprendre"
            : "Démarrer"}
        </Button>
      )}
      {(running || (remaining < totalSeconds && !done)) && (
        <button
          onClick={() => {
            setRunning(false);
            setRemaining(totalSeconds);
            setDone(false);
          }}
          className="text-sm text-ink-500 underline"
        >
          Reset
        </button>
      )}
    </div>
  );
}

function DeferredNotes() {
  const [notes, setNotes] = useState<string[]>(["", "", ""]);
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
      <p className="pt-1 text-xs text-ink-400">
        Note rapide — pas sauvegardée. Si tu veux garder, recopie ailleurs.
      </p>
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

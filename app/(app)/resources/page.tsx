import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EMERGENCY_CONTACTS } from "@/lib/constants";
import Link from "next/link";
import { Phone } from "lucide-react";

const exercises = [
  {
    title: "Respiration 4-6 (1 min)",
    emoji: "🫁",
    desc: "Inspire 4 sec, expire 6 sec. Répète pendant 1 minute.",
    href: "/craving",
  },
  {
    title: "Sortie express",
    emoji: "🚶",
    desc: "Enfile des chaussures et marche 10 min, sans téléphone.",
  },
  {
    title: "Eau + fruit",
    emoji: "💧",
    desc: "Grand verre d'eau, un fruit. Attends 15 minutes.",
  },
  {
    title: "Liste des envies différées",
    emoji: "📝",
    desc: "Écris 3 choses que tu aimerais faire à la place.",
  },
];

const reads = [
  {
    title: "Comprendre le craving",
    emoji: "📖",
    desc: "Le craving est une vague. Elle monte, elle retombe — même sans rien faire.",
  },
  {
    title: "Réduction des risques",
    emoji: "🛡️",
    desc: "Arrêter n'est pas le seul objectif valable. Réduire aussi.",
  },
  {
    title: "Parler à son entourage",
    emoji: "🤝",
    desc: "Comment expliquer ton objectif à tes proches sans te justifier.",
  },
];

export default function ResourcesPage() {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ressources</h1>
        <p className="text-ink-600">
          Des outils concrets, quand tu en as besoin.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>🎯 Exercices rapides</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-2">
          {exercises.map((e) =>
            e.href ? (
              <Link
                key={e.title}
                href={e.href}
                className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 hover:bg-ink-50"
              >
                <span className="text-2xl">{e.emoji}</span>
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-sm text-ink-600">{e.desc}</div>
                </div>
              </Link>
            ) : (
              <div
                key={e.title}
                className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3"
              >
                <span className="text-2xl">{e.emoji}</span>
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-sm text-ink-600">{e.desc}</div>
                </div>
              </div>
            )
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📚 À lire</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-2">
          {reads.map((r) => (
            <div
              key={r.title}
              className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3"
            >
              <span className="text-2xl">{r.emoji}</span>
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-sm text-ink-600">{r.desc}</div>
              </div>
            </div>
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

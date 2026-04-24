import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { APP_NAME } from "@/lib/constants";

export default function LandingPage() {
  return (
    <main className="hero-gradient min-h-screen">
      <div className="mx-auto flex max-w-xl flex-col gap-10 px-6 pt-10 pb-16">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/login"
            className="text-sm font-medium text-clinic-700 hover:text-clinic-500"
          >
            Se connecter
          </Link>
        </div>

        <section className="flex flex-col gap-5 pt-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-clinic-700 shadow-card">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
            Pour toi, à ton rythme
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Avance vers la sobriété,{" "}
            <span className="text-clinic-600">sans jugement.</span>
          </h1>
          <p className="text-lg text-ink-600">
            {APP_NAME} t'aide à suivre tes consommations, comprendre tes
            déclencheurs et gérer les envies. Tu peux aussi partager ton suivi
            avec un psychiatre, quand tu veux.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="sm:flex-1">
              <Button size="lg" className="w-full">
                Commencer
              </Button>
            </Link>
            <Link href="#how" className="sm:flex-1">
              <Button variant="secondary" size="lg" className="w-full">
                Comment ça marche
              </Button>
            </Link>
          </div>
        </section>

        <section id="how" className="grid gap-4 pt-6 sm:grid-cols-3">
          {[
            {
              title: "Note, sans te juger",
              body: "Une conso, un craving, un ressenti — en 20 secondes.",
              emoji: "📝",
            },
            {
              title: "Vois ton évolution",
              body: "Finances, streaks, contextes à risque, ce que tu gagnes.",
              emoji: "📈",
            },
            {
              title: "Partage si tu veux",
              body: "Donne l'accès à un pro quand tu es prêt·e. Pas avant.",
              emoji: "🤝",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-3xl bg-white p-5 shadow-card border border-ink-100"
            >
              <div className="text-2xl">{f.emoji}</div>
              <div className="mt-2 font-semibold">{f.title}</div>
              <div className="mt-1 text-sm text-ink-600">{f.body}</div>
            </div>
          ))}
        </section>

        <p className="pt-10 text-center text-xs text-ink-400">
          {APP_NAME} n'est pas un substitut à un suivi médical. En cas
          d'urgence, appelle le 15 ou le 3114.
        </p>
      </div>
    </main>
  );
}

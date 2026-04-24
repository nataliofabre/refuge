"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="hero-gradient min-h-screen">
      <div className="mx-auto flex max-w-md flex-col gap-8 px-6 pt-10">
        <Link href="/" aria-label="Retour">
          <Logo />
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            On commence ?
          </h1>
          <p className="text-ink-600">
            Entre ton email. Tu recevras un lien magique pour te connecter.
          </p>
        </div>

        <form onSubmit={sendMagicLink} className="flex flex-col gap-4">
          <Field label="Ton email">
            <Input
              type="email"
              required
              placeholder="toi@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>

          <Button
            type="submit"
            size="lg"
            disabled={status === "sending" || !email}
          >
            {status === "sending" ? "Envoi..." : "Recevoir le lien"}
          </Button>

          {status === "sent" && (
            <div className="rounded-2xl bg-mint-50 border border-mint-300 p-4 text-sm text-mint-700">
              ✅ Lien envoyé. Vérifie ta boîte mail (et les spams).
            </div>
          )}
          {status === "error" && error && (
            <div className="rounded-2xl bg-coral-50 border border-coral-300 p-4 text-sm text-coral-700">
              {error}
            </div>
          )}
        </form>

        <p className="text-xs text-ink-400">
          En continuant, tu acceptes nos conditions et notre politique de
          confidentialité. Tes données restent privées — tu décides avec qui
          les partager.
        </p>
      </div>
    </main>
  );
}

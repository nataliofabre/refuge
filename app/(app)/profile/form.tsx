"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { GOAL_TYPES } from "@/lib/constants";

export function ProfileForm({
  initial,
  email,
}: {
  initial: { display_name: string; main_goal: string; consent_to_share_data: boolean };
  email: string;
}) {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [mainGoal, setMainGoal] = useState(initial.main_goal);
  const [share, setShare] = useState(initial.consent_to_share_data);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_profiles").update({
      display_name: displayName || null,
      main_goal: (mainGoal || null) as
        | "risk_reduction"
        | "total_stop"
        | "financial"
        | "sleep"
        | "other"
        | null,
      consent_to_share_data: share,
      consent_recorded_at: share ? new Date().toISOString() : null,
    }).eq("user_id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>👤 Infos</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <Field label="Email" hint="Ton email de connexion.">
          <Input value={email} disabled />
        </Field>
        <Field label="Prénom ou pseudo">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </Field>
        <Field label="Objectif principal">
          <select
            className="h-11 rounded-2xl border border-ink-200 bg-white px-3"
            value={mainGoal}
            onChange={(e) => setMainGoal(e.target.value)}
          >
            <option value="">—</option>
            {GOAL_TYPES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>

        <label className="flex items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4">
          <input
            type="checkbox"
            checked={share}
            onChange={(e) => setShare(e.target.checked)}
            className="mt-1 h-5 w-5"
          />
          <div>
            <div className="font-medium text-sm">
              Partager mes données avec un psychiatre
            </div>
            <div className="text-xs text-ink-600 mt-1">
              Tu restes maître·sse. Tu peux retirer ce partage à tout moment.
            </div>
          </div>
        </label>

        <Button onClick={save} disabled={saving}>
          {saving ? "Enregistrement..." : saved ? "✅ Enregistré" : "Enregistrer"}
        </Button>
      </CardBody>
    </Card>
  );
}

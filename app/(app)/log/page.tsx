"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Chip, Field, Input, Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import {
  CONSUMPTION_CATEGORIES,
  EMOTION_STATES,
  ALCOHOL_SUBCATEGORIES,
} from "@/lib/constants";
import type {
  ConsumptionCategory,
  EmotionState,
} from "@/lib/types";

export default function LogPage() {
  const router = useRouter();
  const supabase = createClient();
  const [category, setCategory] = useState<ConsumptionCategory>("alcohol");
  const [subcategory, setSubcategory] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [price, setPrice] = useState<string>("");
  const [context, setContext] = useState<string>("");
  const [trigger, setTrigger] = useState<EmotionState | "">("");
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const cat = CONSUMPTION_CATEGORIES.find((c) => c.value === category);

  async function save() {
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) return;
    const { error } = await supabase.from("consumptions").insert({
      user_id: user.id,
      category,
      subcategory: subcategory || null,
      quantity: Number(quantity || 1),
      unit: cat?.unit ?? "épisode",
      price: price ? Number(price) : null,
      context: context || null,
      trigger_reason: (trigger || null) as EmotionState | null,
      note: note || null,
    });
    setSaving(false);
    if (!error) router.push("/dashboard?logged=1");
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Noter une consommation
        </h1>
        <p className="text-ink-600">
          Pas de jugement. Juste un repère pour toi.
        </p>
      </header>

      <Card>
        <CardBody className="flex flex-col gap-5">
          <Field label="Type">
            <div className="flex flex-wrap gap-2">
              {CONSUMPTION_CATEGORIES.map((c) => (
                <Chip
                  key={c.value}
                  active={category === c.value}
                  onClick={() => {
                    setCategory(c.value);
                    setSubcategory("");
                  }}
                >
                  {c.emoji} {c.label}
                </Chip>
              ))}
            </div>
          </Field>

          {category === "alcohol" && (
            <Field label="Quoi, plus précisément ?">
              <div className="flex flex-wrap gap-2">
                {ALCOHOL_SUBCATEGORIES.map((s) => (
                  <Chip
                    key={s.value}
                    active={subcategory === s.value}
                    onClick={() => setSubcategory(s.value)}
                  >
                    {s.label}
                  </Chip>
                ))}
              </div>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Quantité (${cat?.unit ?? ""})`}>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field label="Prix (€)" hint="Optionnel">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="—"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Contexte" hint="Soirée, seul·e, sortie, etc.">
            <Input
              placeholder="Ex : apéro avec Léa"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </Field>

          <Field label="Ce qui a déclenché">
            <div className="flex flex-wrap gap-2">
              {EMOTION_STATES.map((e) => (
                <Chip
                  key={e.value}
                  active={trigger === e.value}
                  onClick={() => setTrigger(e.value as EmotionState)}
                >
                  {e.label}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Note" hint="Privé, juste pour toi.">
            <Textarea
              placeholder="Un mot sur le moment, ce que tu ressens..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        </CardBody>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={saving || !quantity}
          onClick={save}
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      <p className="text-center text-xs text-ink-400">
        On te reposera la question à froid dans 24h — c'est optionnel.
      </p>
    </div>
  );
}

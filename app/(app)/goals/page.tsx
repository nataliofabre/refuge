import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { GOAL_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false });

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mes objectifs</h1>
        <p className="text-ink-600">Un cap, pas une contrainte.</p>
      </header>

      {goals?.length ? (
        <div className="flex flex-col gap-3">
          {goals.map((g) => {
            const label =
              GOAL_TYPES.find((t) => t.value === g.goal_type)?.label ??
              g.goal_type;
            return (
              <Card key={g.id}>
                <CardHeader>
                  <CardTitle>{label}</CardTitle>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-ink-600">
                    {g.description || "—"}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-400">
                    <span>Depuis le {formatDate(g.start_date)}</span>
                    {g.active ? (
                      <span className="rounded-full bg-mint-50 px-2 py-0.5 text-mint-700">
                        Actif
                      </span>
                    ) : (
                      <span className="rounded-full bg-ink-100 px-2 py-0.5">
                        Archivé
                      </span>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-10">
            <div className="text-2xl">🎯</div>
            <div className="mt-2 font-semibold">Pas encore d'objectif</div>
            <div className="text-sm text-ink-600 mt-1">
              Définis ton objectif principal depuis ton profil.
            </div>
            <Link href="/profile" className="mt-4 inline-block">
              <Button>Aller au profil</Button>
            </Link>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

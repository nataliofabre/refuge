import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PatientsListPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "practitioner" && me?.role !== "admin") {
    return (
      <main className="mx-auto max-w-xl p-6">
        <Card>
          <CardBody className="text-center py-10">
            <div className="text-2xl">🔒</div>
            <div className="mt-2 font-semibold">Accès professionnel</div>
            <div className="text-sm text-ink-600 mt-1">
              Cette vue est réservée aux psychiatres et praticiens validés.
            </div>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-clinic-600 underline"
            >
              Retour à mon espace
            </Link>
          </CardBody>
        </Card>
      </main>
    );
  }

  const { data: links } = await supabase
    .from("patient_practitioner_links")
    .select("id, status, patient_user_id, created_at")
    .eq("practitioner_user_id", user.id)
    .order("created_at", { ascending: false });

  const patientIds = (links ?? []).map((l) => l.patient_user_id);
  const { data: profiles } = patientIds.length
    ? await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .in("user_id", patientIds)
    : { data: [] as { user_id: string; display_name: string | null }[] };

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.display_name])
  );

  return (
    <main className="mx-auto max-w-2xl p-6 pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mes patients</h1>
        <p className="text-ink-600">
          Accès en lecture aux patients qui t'ont autorisé.
        </p>
      </header>

      {links?.length ? (
        <div className="grid gap-3">
          {links.map((l) => (
            <Link
              key={l.id}
              href={`/pro/patients/${l.patient_user_id}`}
              className="block"
            >
              <Card className="hover:border-clinic-300 transition">
                <CardBody className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">
                      {nameById.get(l.patient_user_id) ?? "Patient"}
                    </div>
                    <div className="text-xs text-ink-400 mt-1">
                      Statut :{" "}
                      <span
                        className={
                          l.status === "active"
                            ? "text-mint-700"
                            : l.status === "pending"
                            ? "text-sand-500"
                            : "text-coral-700"
                        }
                      >
                        {l.status}
                      </span>
                    </div>
                  </div>
                  <span className="text-ink-400">›</span>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-10">
            <div className="text-2xl">👥</div>
            <div className="mt-2 font-semibold">Aucun patient lié</div>
            <div className="text-sm text-ink-600 mt-1">
              Partage ton code d'accès avec tes patients pour les lier.
            </div>
          </CardBody>
        </Card>
      )}
    </main>
  );
}

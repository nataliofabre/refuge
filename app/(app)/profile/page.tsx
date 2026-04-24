import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { GOAL_TYPES } from "@/lib/constants";
import { ProfileForm } from "./form";
import { SignOutButton } from "./sign-out";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mon profil</h1>
        <p className="text-ink-600">
          Modifie tes infos, tes préférences, ton partage.
        </p>
      </header>

      <ProfileForm
        initial={{
          display_name: profile?.display_name ?? "",
          main_goal: profile?.main_goal ?? "",
          consent_to_share_data: profile?.consent_to_share_data ?? false,
        }}
        email={user.email ?? ""}
      />

      <Card>
        <CardHeader>
          <CardTitle>🔒 Confidentialité</CardTitle>
        </CardHeader>
        <CardBody className="text-sm text-ink-600">
          <p>
            Tes données sont stockées chiffrées et restent privées par défaut.
            Tu peux demander un export ou une suppression à tout moment.
          </p>
        </CardBody>
      </Card>

      <SignOutButton />
    </div>
  );
}

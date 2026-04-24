import { BottomNav } from "@/components/ui/bottom-nav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id, main_goal")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.main_goal) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-ink-50 pb-24">
      <main className="mx-auto max-w-xl px-4 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}

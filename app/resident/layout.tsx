import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ResidentNav from "@/components/resident/resident-nav";

export default async function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()) as { data: any };

  if (!profile || profile.role !== "resident") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-background">
      <ResidentNav profile={profile} />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

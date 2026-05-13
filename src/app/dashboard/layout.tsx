import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Sidebar from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <>
      <div className="ambient-bg" />
      <Sidebar
        userEmail={user.email ?? ""}
        userName={user.user_metadata?.full_name ?? null}
      />
      <main className="main-content">
        <div className="page-container">{children}</div>
      </main>
    </>
  );
}

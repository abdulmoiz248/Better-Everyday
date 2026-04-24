import { redirect } from "next/navigation";
import { GoogleLoginButton } from "@/components/google-login-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <main className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-sm text-zinc-500">Welcome to BetterEveryday</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
          Track your skills every day
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          Sign in with Google to manage skills, view history, and receive your daily
          check-in link by email.
        </p>
        <div className="mt-6">
          <GoogleLoginButton />
        </div>
      </main>
    </div>
  );
}

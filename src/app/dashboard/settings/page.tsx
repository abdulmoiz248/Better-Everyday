import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/settings-form";
import { DEFAULT_CHECKIN_FIELDS } from "@/lib/types";
import type { UserSettingsRecord } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: settingsData } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const settings = settingsData as UserSettingsRecord | null;

  const currentSettings = {
    checkin_fields: settings?.checkin_fields ?? DEFAULT_CHECKIN_FIELDS,
    tracked_areas: settings?.tracked_areas ?? [],
    review_context: settings?.review_context ?? "",
    timezone: settings?.timezone ?? "UTC",
    integrations: settings?.integrations ?? { github: false, leetcode: false },
  };

  return (
    <>
      <div className="page-header animate-in">
        <h1>Settings</h1>
        <p>
          Customize your BetterEveryday experience — check-in questions, tracked
          areas, review style, and more.
        </p>
      </div>

      <div className="animate-in animate-delay-1">
        <SettingsForm settings={currentSettings} />
      </div>
    </>
  );
}

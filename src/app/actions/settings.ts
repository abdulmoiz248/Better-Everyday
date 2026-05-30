"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CheckinField, TrackedAreaConfig } from "@/lib/types";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return { supabase, user };
}

export async function saveCheckinFields(fields: CheckinField[]) {
  const { supabase, user } = await requireUser();

  // Validate: at least one required field
  const hasRequired = fields.some((f) => f.required);
  if (!hasRequired || fields.length === 0) {
    throw new Error("At least one required field must be configured");
  }

  // Validate field ids are unique
  const ids = fields.map((f) => f.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Field IDs must be unique");
  }

  await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      checkin_fields: fields,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}

export async function saveTrackedAreas(areas: TrackedAreaConfig[]) {
  const { supabase, user } = await requireUser();

  await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      tracked_areas: areas,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/analytics");
}

export async function saveReviewContext(context: string) {
  const { supabase, user } = await requireUser();

  await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      review_context: context.trim(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/reviews");
}

export async function saveTimezone(timezone: string) {
  const { supabase, user } = await requireUser();

  await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      timezone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/dashboard/settings");
}

export async function saveIntegrations(integrations: { github: boolean; leetcode: boolean }) {
  const { supabase, user } = await requireUser();

  await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      integrations,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/analytics");
}

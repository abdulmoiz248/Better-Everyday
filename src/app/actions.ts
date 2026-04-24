"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCheckinTokenForUser,
  hashToken,
  sendCheckinEmail,
} from "@/lib/checkin";
import { fetchGitHubAnalysis } from "@/lib/github";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export async function addSkill(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const status = String(formData.get("status") ?? "pending");

  if (!name) {
    return;
  }

  const safeStatus =
    status === "learning" || status === "completed" ? status : "pending";

  await supabase.from("skills").insert({
    user_id: user.id,
    name,
    status: safeStatus,
  });

  revalidatePath("/dashboard");
}

export async function updateSkillStatus(formData: FormData) {
  const { supabase, user } = await requireUser();
  const skillId = String(formData.get("skillId") ?? "");
  const status = String(formData.get("status") ?? "pending");

  if (!skillId) {
    return;
  }

  const safeStatus =
    status === "learning" || status === "completed" ? status : "pending";

  await supabase
    .from("skills")
    .update({
      status: safeStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", skillId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}

export async function requestMyCheckinLink() {
  const { user } = await requireUser();

  if (!user.email) {
    throw new Error("No email is available for this user");
  }

  const token = await createCheckinTokenForUser(user.id, user.email);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const checkinLink = `${appUrl}/check-in/${token}`;

  await sendCheckinEmail({
    to: user.email,
    checkinLink,
  });

  revalidatePath("/dashboard");
}

export async function syncGithubProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const username = String(formData.get("githubUsername") ?? "").trim();

  if (!username) {
    return;
  }

  const analysis = await fetchGitHubAnalysis(username);

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata.full_name ?? null,
      github_username: analysis.username,
      github_analysis: analysis,
      github_synced_at: analysis.analyzedAt,
    },
    {
      onConflict: "user_id",
    },
  );

  revalidatePath("/dashboard");
}

export async function refreshGithubProfile() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("github_username")
    .eq("user_id", user.id)
    .maybeSingle();

  const githubUsername = profile?.github_username?.trim();
  if (!githubUsername) {
    return;
  }

  const analysis = await fetchGitHubAnalysis(githubUsername);

  await supabase
    .from("profiles")
    .update({
      github_analysis: analysis,
      github_synced_at: analysis.analyzedAt,
    })
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}

export async function submitDailyCheckin(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const learnedToday = String(formData.get("learnedToday") ?? "").trim();
  const leetcodeQuestion = String(formData.get("leetcodeQuestion") ?? "").trim();
  const blockers = String(formData.get("blockers") ?? "").trim();
  const wins = String(formData.get("wins") ?? "").trim();

  if (!token || !learnedToday) {
    throw new Error("Invalid check-in submission");
  }

  const tokenHash = hashToken(token);
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: tokenRow } = await supabaseAdmin
    .from("checkin_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!tokenRow) {
    throw new Error("This check-in link is invalid");
  }

  if (tokenRow.used_at) {
    throw new Error("This check-in link has already been used");
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    throw new Error("This check-in link has expired");
  }

  await supabaseAdmin.from("daily_reflections").insert({
    user_id: tokenRow.user_id,
    learned_today: learnedToday,
    leetcode_question: leetcodeQuestion || null,
    blockers: blockers || null,
    wins: wins || null,
  });

  await supabaseAdmin
    .from("checkin_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  redirect("/check-in/success");
}

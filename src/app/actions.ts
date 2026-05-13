"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCheckinTokenForUser,
  hashToken,
  sendCheckinEmail,
} from "@/lib/checkin";
import { fetchGitHubAnalysis } from "@/lib/github";
import { fetchLeetCodeAnalysis } from "@/lib/leetcode";
import { buildSkillGapAnalysis } from "@/lib/skill-gap";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeProjectStatus(rawStatus: string) {
  if (rawStatus === "active" || rawStatus === "completed") {
    return rawStatus;
  }

  return "future";
}

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
  revalidatePath("/dashboard/skills");
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
  revalidatePath("/dashboard/skills");
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
  const leetcodeUsername = String(formData.get("leetcodeUsername") ?? "").trim();

  if (!username && !leetcodeUsername) {
    return;
  }

  const [{ data: currentProfile }, { data: skillsData }, { data: reflectionsData }, { data: updatesData }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("github_username, github_analysis, leetcode_username, leetcode_analysis")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("skills")
        .select("name, status, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("daily_reflections")
        .select("learned_today, leetcode_question, blockers, wins, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("project_updates")
        .select("update_note, learned, stats, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const githubLookupUsername = username || currentProfile?.github_username || "";
  const leetcodeLookupUsername =
    leetcodeUsername || currentProfile?.leetcode_username || "";

  const githubAnalysis = githubLookupUsername
    ? await fetchGitHubAnalysis(githubLookupUsername)
    : null;
  const leetcodeAnalysis = leetcodeLookupUsername
    ? await fetchLeetCodeAnalysis(leetcodeLookupUsername)
    : null;

  const skillGapAnalysis = buildSkillGapAnalysis({
    skills: skillsData ?? [],
    reflections: reflectionsData ?? [],
    projectUpdates: updatesData ?? [],
    githubAnalysis,
    leetcodeAnalysis,
  });

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata.full_name ?? null,
      github_username: githubAnalysis?.username ?? null,
      github_analysis: githubAnalysis,
      github_synced_at: githubAnalysis?.analyzedAt ?? null,
      leetcode_username: leetcodeAnalysis?.username ?? null,
      leetcode_analysis: leetcodeAnalysis,
      skill_gap_analysis: skillGapAnalysis,
      skill_gap_synced_at: skillGapAnalysis.generatedAt,
    },
    {
      onConflict: "user_id",
    },
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/analytics");
}

export async function refreshGithubProfile() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("github_username, leetcode_username")
    .eq("user_id", user.id)
    .maybeSingle();

  const githubUsername = profile?.github_username?.trim();
  const leetcodeUsername = profile?.leetcode_username?.trim();

  if (!githubUsername && !leetcodeUsername) {
    return;
  }

  const [{ data: skillsData }, { data: reflectionsData }, { data: updatesData }] =
    await Promise.all([
      supabase
        .from("skills")
        .select("name, status, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("daily_reflections")
        .select("learned_today, leetcode_question, blockers, wins, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("project_updates")
        .select("update_note, learned, stats, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const githubAnalysis = githubUsername
    ? await fetchGitHubAnalysis(githubUsername)
    : null;
  const leetcodeAnalysis = leetcodeUsername
    ? await fetchLeetCodeAnalysis(leetcodeUsername)
    : null;

  const skillGapAnalysis = buildSkillGapAnalysis({
    skills: skillsData ?? [],
    reflections: reflectionsData ?? [],
    projectUpdates: updatesData ?? [],
    githubAnalysis,
    leetcodeAnalysis,
  });

  await supabase
    .from("profiles")
    .update({
      github_analysis: githubAnalysis,
      github_synced_at: githubAnalysis?.analyzedAt ?? null,
      leetcode_analysis: leetcodeAnalysis,
      skill_gap_analysis: skillGapAnalysis,
      skill_gap_synced_at: skillGapAnalysis.generatedAt,
    })
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/analytics");
}

export async function addFutureProject(formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) {
    return;
  }

  await supabase.from("projects").insert({
    user_id: user.id,
    title,
    description: description || null,
    status: "future",
    progress_percent: 0,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
}

export async function startProject(formData: FormData) {
  const { supabase, user } = await requireUser();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    return;
  }

  const now = new Date().toISOString();

  await supabase
    .from("projects")
    .update({
      status: "active",
      started_at: now,
      updated_at: now,
    })
    .eq("id", projectId)
    .eq("user_id", user.id);

  await supabase.from("project_updates").insert({
    user_id: user.id,
    project_id: projectId,
    update_note: "Project moved to active work",
    progress_percent: 0,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
}

export async function logProjectProgress(formData: FormData) {
  const { supabase, user } = await requireUser();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const updateNote = String(formData.get("updateNote") ?? "").trim();
  const learned = String(formData.get("learned") ?? "").trim();
  const stats = String(formData.get("stats") ?? "").trim();
  const currentFocus = String(formData.get("currentFocus") ?? "").trim();
  const status = normalizeProjectStatus(String(formData.get("status") ?? "future").trim());
  const progressValue = Number(String(formData.get("progressPercent") ?? "0").trim());

  if (!projectId || !updateNote) {
    return;
  }

  const progressPercent = Number.isFinite(progressValue)
    ? Math.max(0, Math.min(100, Math.round(progressValue)))
    : 0;
  const now = new Date().toISOString();
  const projectUpdate: {
    status: "future" | "active" | "completed";
    progress_percent: number;
    current_focus: string | null;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
  } = {
    status,
    progress_percent: progressPercent,
    current_focus: currentFocus || null,
    updated_at: now,
  };

  if (status === "active") {
    projectUpdate.started_at = now;
  }

  if (status === "completed") {
    projectUpdate.completed_at = now;
  }

  await supabase
    .from("projects")
    .update(projectUpdate)
    .eq("id", projectId)
    .eq("user_id", user.id);

  await supabase.from("project_updates").insert({
    user_id: user.id,
    project_id: projectId,
    update_note: updateNote,
    learned: learned || null,
    stats: stats || null,
    progress_percent: progressPercent,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
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

  const userId = tokenRow.user_id;
  const now = new Date();

  // Insert the daily reflection
  await supabaseAdmin.from("daily_reflections").insert({
    user_id: userId,
    learned_today: learnedToday,
    leetcode_question: leetcodeQuestion || null,
    blockers: blockers || null,
    wins: wins || null,
  });

  // Mark token as used
  await supabaseAdmin
    .from("checkin_tokens")
    .update({ used_at: now.toISOString() })
    .eq("id", tokenRow.id);

  // Update streak
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("current_streak, longest_streak, streak_last_updated")
    .eq("user_id", userId)
    .maybeSingle();

  let newStreak = 1;
  let newLongestStreak = 1;

  if (profile) {
    const lastUpdated = profile.streak_last_updated
      ? new Date(profile.streak_last_updated)
      : new Date(0);
    const daysSinceLastUpdate = Math.floor(
      (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24),
    );

    // If updated within the last 24 hours, don't increment (same day)
    if (daysSinceLastUpdate === 0) {
      newStreak = profile.current_streak;
    } else if (daysSinceLastUpdate === 1) {
      // Consecutive day: increment
      newStreak = (profile.current_streak || 0) + 1;
    } else {
      // Streak broken: reset to 1
      newStreak = 1;
    }

    newLongestStreak = Math.max(newStreak, profile.longest_streak || 0);
  }

  await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        streak_last_updated: now.toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

  redirect("/check-in/success");
}


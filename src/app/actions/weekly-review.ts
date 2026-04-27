"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { computeWeeklyMetrics } from "@/lib/metrics";
import { generateBrutalReview } from "@/lib/brutal-review";

export async function computeAndSaveWeeklyReview(userId: string, weekStartDate: Date, weekEndDate: Date) {
  const supabase = createSupabaseAdminClient();

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("github_username, leetcode_username")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("User profile not found");
  }

  // Fetch skills created in week
  const { data: skills } = await supabase
    .from("skills")
    .select("name, status, created_at")
    .eq("user_id", userId)
    .gte("created_at", weekStartDate.toISOString())
    .lte("created_at", weekEndDate.toISOString());

  // Fetch reflections in week
  const { data: reflections } = await supabase
    .from("daily_reflections")
    .select("learned_today, leetcode_question, blockers, wins, created_at")
    .eq("user_id", userId)
    .gte("created_at", weekStartDate.toISOString())
    .lte("created_at", weekEndDate.toISOString());

  // Fetch project updates in week
  const { data: projectUpdates } = await supabase
    .from("project_updates")
    .select("update_note, learned, stats, created_at")
    .eq("user_id", userId)
    .gte("created_at", weekStartDate.toISOString())
    .lte("created_at", weekEndDate.toISOString());

  // Fetch latest LeetCode analysis
  const { data: leetcodeAnalysisData } = await supabase
    .from("profiles")
    .select("leetcode_analysis")
    .eq("user_id", userId)
    .single();

  // Compute metrics
  const metrics = computeWeeklyMetrics({
    startDate: weekStartDate,
    endDate: weekEndDate,
    skills: skills || [],
    reflections: reflections || [],
    projectUpdates: projectUpdates || [],
    leetcodeAnalysis: leetcodeAnalysisData?.leetcode_analysis || null,
  });

  // Generate brutal review
  const llmFeedback = await generateBrutalReview({
    username: profile.github_username || "User",
    weekStartDate,
    weekEndDate,
    metrics,
  });

  // Save to weekly_reviews table
  const { data, error } = await supabase
    .from("weekly_reviews")
    .upsert(
      {
        user_id: userId,
        week_start_date: weekStartDate.toISOString().split("T")[0],
        week_end_date: weekEndDate.toISOString().split("T")[0],
        total_hours: metrics.totalHours,
        problems_solved: metrics.problemsSolved,
        skills_improved: metrics.skillsImproved,
        missed_days: metrics.missedDays,
        depth_score: metrics.depthScore,
        consistency_score: metrics.consistencyScore,
        variety_score: metrics.varietyScore,
        llm_feedback: llmFeedback,
        brutal_reflection: "",
      },
      {
        onConflict: "user_id,week_start_date",
      },
    )
    .select();

  if (error) {
    console.error("Failed to save weekly review:", error);
    throw error;
  }

  return data?.[0];
}

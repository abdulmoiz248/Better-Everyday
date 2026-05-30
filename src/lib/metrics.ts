import {
  LeetCodeAnalysisRecord,
  ProjectUpdateRecord,
  ReflectionRecord,
  SkillRecord,
  WeeklyMetrics,
} from "@/lib/types";

type ComputeMetricsInput = {
  startDate: Date;
  endDate: Date;
  skills: Pick<SkillRecord, "name" | "status" | "created_at">[];
  reflections: Pick<
    ReflectionRecord,
    "learned_today" | "leetcode_question" | "blockers" | "wins" | "created_at"
  >[];
  projectUpdates: Pick<ProjectUpdateRecord, "update_note" | "learned" | "stats" | "created_at">[];
  leetcodeAnalysis: LeetCodeAnalysisRecord | null;
};

function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function isWithinRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date);
  return d >= start && d <= end;
}

// Calculate depth: ratio of medium/hard to total problems, or fallback based on focus/skills/projects
function computeDepthScore(
  leetcodeAnalysis: LeetCodeAnalysisRecord | null,
  skills: Pick<SkillRecord, "status">[] = [],
  projectUpdates: Pick<ProjectUpdateRecord, "update_note">[] = [],
): number {
  if (leetcodeAnalysis && leetcodeAnalysis.solvedCount.total > 0) {
    const { total, easy, medium, hard } = leetcodeAnalysis.solvedCount;
    const hardCount = medium + hard;
    const ratio = hardCount / total;

    // Score: 0 if all easy, 100 if balanced or hard-heavy
    // Target: 40-60% medium/hard
    if (ratio <= 0.2) return 20;
    if (ratio <= 0.4) return 50;
    if (ratio <= 0.6) return 100;
    if (ratio <= 0.8) return 80;
    return 60; // Too hard-heavy can be inefficient
  }

  // Generic fallback: base depth score on active learning and projects
  let score = 40; // Base score for showing up

  const learningOrCompleted = skills.filter(
    (s) => s.status === "learning" || s.status === "completed",
  ).length;
  score += learningOrCompleted * 10;

  if (projectUpdates.length > 0) {
    score += 20;
  }

  return Math.min(100, score);
}

// Calculate consistency: did user check in daily?
function computeConsistencyScore(
  start: Date,
  end: Date,
  reflections: Pick<ReflectionRecord, "created_at">[],
): number {
  const totalDays = daysBetween(start, end);
  if (totalDays === 0) return 0;

  // Group reflections by date
  const daysWithReflections = new Set<string>();
  for (const reflection of reflections) {
    if (isWithinRange(new Date(reflection.created_at), start, end)) {
      const dateStr = new Date(reflection.created_at).toISOString().split("T")[0];
      daysWithReflections.add(dateStr);
    }
  }

  const checkInDays = daysWithReflections.size;
  const consistency = (checkInDays / totalDays) * 100;

  // Score 0-100 based on %
  return Math.min(100, Math.max(0, consistency));
}

// Calculate variety: diversity of topics/skills touched
function computeVarietyScore(
  leetcodeAnalysis: LeetCodeAnalysisRecord | null,
  skills: Pick<SkillRecord, "name">[],
  reflections: Pick<ReflectionRecord, "learned_today" | "leetcode_question">[],
): number {
  const topics = new Set<string>();

  // From LeetCode tags
  if (leetcodeAnalysis) {
    for (const tag of leetcodeAnalysis.topTags) {
      topics.add(tag.name.toLowerCase());
    }
  }

  // From skill names
  for (const skill of skills) {
    topics.add(skill.name.toLowerCase());
  }

  // From reflection text (extract capitalized words as potential topics)
  for (const reflection of reflections) {
    const text = [reflection.learned_today, reflection.leetcode_question]
      .filter(Boolean)
      .join(" ");
    const words = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g) || [];
    for (const word of words) {
      topics.add(word.toLowerCase());
    }
  }

  // Score based on unique topic count
  // 1-3 topics: 20, 4-6: 50, 7-10: 80, 11+: 100
  const count = topics.size;
  if (count <= 0) return 0;
  if (count <= 2) return 20;
  if (count <= 4) return 40;
  if (count <= 6) return 60;
  if (count <= 8) return 80;
  if (count <= 10) return 90;
  return 100;
}

// Count problems solved or general items logged in week
function countProblemsSolved(
  start: Date,
  end: Date,
  leetcodeAnalysis: LeetCodeAnalysisRecord | null,
  reflections: Pick<ReflectionRecord, "leetcode_question" | "created_at">[],
  projectUpdates: Pick<ProjectUpdateRecord, "created_at">[] = [],
  skills: Pick<SkillRecord, "status" | "created_at">[] = [],
): number {
  if (leetcodeAnalysis) {
    return leetcodeAnalysis.solvedCount.total;
  }

  // Generic fallback: total logged activities this week
  let count = 0;
  for (const reflection of reflections) {
    if (isWithinRange(new Date(reflection.created_at), start, end)) {
      count++;
    }
  }
  for (const update of projectUpdates) {
    if (isWithinRange(new Date(update.created_at), start, end)) {
      count++;
    }
  }
  for (const skill of skills) {
    if (skill.status === "completed" && isWithinRange(new Date(skill.created_at), start, end)) {
      count++;
    }
  }

  return count;
}

// Estimate hours (1.5 per reflection/check-in session as rough estimate)
function estimateHours(
  start: Date,
  end: Date,
  reflections: Pick<ReflectionRecord, "created_at">[],
): number {
  let hours = 0;
  for (const reflection of reflections) {
    if (isWithinRange(new Date(reflection.created_at), start, end)) {
      hours += 1.5; // Assume 1.5 hours per daily session
    }
  }

  return Math.round(hours * 10) / 10;
}

// Extract improved skills from reflections
function extractSkillsImproved(
  reflections: Pick<ReflectionRecord, "learned_today">[],
): string[] {
  const skillsSet = new Set<string>();
  for (const reflection of reflections) {
    // Look for patterns like "learned X", "mastered Y", "improved Z"
    const learnedMatch = reflection.learned_today.match(
      /(?:learned|mastered|practiced|improved|studied)\s+([^,.]+)/gi,
    );
    if (learnedMatch) {
      for (const match of learnedMatch) {
        const skill = match.replace(/^(?:learned|mastered|practiced|improved|studied)\s+/i, "");
        skillsSet.add(skill.trim());
      }
    }
  }

  return Array.from(skillsSet).slice(0, 5);
}

export function computeWeeklyMetrics(input: ComputeMetricsInput): WeeklyMetrics {
  const metricsRange = {
    start: input.startDate,
    end: input.endDate,
  };

  const depthScore = computeDepthScore(input.leetcodeAnalysis, input.skills as any, input.projectUpdates as any);
  const consistencyScore = computeConsistencyScore(
    metricsRange.start,
    metricsRange.end,
    input.reflections,
  );
  const varietyScore = computeVarietyScore(
    input.leetcodeAnalysis,
    input.skills,
    input.reflections,
  );

  const totalDays = daysBetween(metricsRange.start, metricsRange.end);
  const recentReflections = input.reflections.filter((r) =>
    isWithinRange(new Date(r.created_at), metricsRange.start, metricsRange.end),
  );

  const problemsSolved = countProblemsSolved(
    metricsRange.start,
    metricsRange.end,
    input.leetcodeAnalysis,
    input.reflections,
    input.projectUpdates as any,
    input.skills as any,
  );

  const totalHours = estimateHours(metricsRange.start, metricsRange.end, input.reflections);
  const skillsImproved = extractSkillsImproved(recentReflections);

  const missedDays = totalDays - recentReflections.length;

  return {
    depthScore: Math.round(depthScore),
    consistencyScore: Math.round(consistencyScore),
    varietyScore: Math.round(varietyScore),
    totalHours,
    problemsSolved,
    skillsImproved,
    missedDays: Math.max(0, missedDays),
  };
}

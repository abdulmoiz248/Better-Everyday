import {
  GitHubAnalysisRecord,
  LeetCodeAnalysisRecord,
  ProjectUpdateRecord,
  ReflectionRecord,
  SkillGapAnalysisRecord,
  SkillRecord,
} from "@/lib/types";

type TrackedArea = {
  name: string;
  aliases: string[];
  leetcodeAliases: string[];
};

const TRACKED_AREAS: TrackedArea[] = [
  {
    name: "Dynamic Programming",
    aliases: ["dynamic programming", "dp"],
    leetcodeAliases: ["dynamic programming", "dp"],
  },
  {
    name: "Graphs",
    aliases: ["graphs", "graph", "bfs", "dfs", "shortest path"],
    leetcodeAliases: ["graph", "breadth-first search", "depth-first search"],
  },
  {
    name: "System Design",
    aliases: ["system design", "scalability", "architecture", "distributed systems"],
    leetcodeAliases: ["design"],
  },
];

type BuildSkillGapInput = {
  now?: Date;
  skills: Pick<SkillRecord, "name" | "status" | "created_at" | "updated_at">[];
  reflections: Pick<
    ReflectionRecord,
    "learned_today" | "leetcode_question" | "blockers" | "wins" | "created_at"
  >[];
  projectUpdates: Pick<
    ProjectUpdateRecord,
    "update_note" | "learned" | "stats" | "created_at"
  >[];
  githubAnalysis: GitHubAnalysisRecord | null;
  leetcodeAnalysis: LeetCodeAnalysisRecord | null;
  trackedAreasConfig?: Array<{ name: string; aliases: string[] }>;
};

function daysBetween(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function containsAlias(text: string, aliases: string[]) {
  const normalized = text.toLowerCase();
  return aliases.some((alias) => normalized.includes(alias));
}

function latestDate(values: Array<string | null | undefined>) {
  let latest: Date | null = null;

  for (const value of values) {
    if (!value) {
      continue;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      continue;
    }

    if (!latest || date > latest) {
      latest = date;
    }
  }

  return latest;
}

function buildEvidenceList(items: Array<string | null | undefined>) {
  return items.filter((item): item is string => Boolean(item)).slice(0, 3);
}

function getLastTouchedDate(area: TrackedArea, input: BuildSkillGapInput) {
  const touchedDates: Date[] = [];

  for (const skill of input.skills) {
    if (containsAlias(skill.name, area.aliases)) {
      touchedDates.push(new Date(skill.updated_at || skill.created_at));
    }
  }

  for (const reflection of input.reflections) {
    const reflectionText = [
      reflection.learned_today,
      reflection.leetcode_question,
      reflection.blockers,
      reflection.wins,
    ]
      .filter(Boolean)
      .join(" ");

    if (containsAlias(reflectionText, area.aliases)) {
      touchedDates.push(new Date(reflection.created_at));
    }
  }

  for (const update of input.projectUpdates) {
    const updateText = [update.update_note, update.learned, update.stats]
      .filter(Boolean)
      .join(" ");

    if (containsAlias(updateText, area.aliases)) {
      touchedDates.push(new Date(update.created_at));
    }
  }

  if (input.githubAnalysis) {
    const githubText = [
      ...input.githubAnalysis.inferredSkills,
      ...input.githubAnalysis.sampleRepos.flatMap((repo) => repo.topics),
    ]
      .join(" ")
      .toLowerCase();

    if (containsAlias(githubText, area.aliases)) {
      touchedDates.push(new Date(input.githubAnalysis.analyzedAt));
    }
  }

  if (input.leetcodeAnalysis) {
    const hasTag = input.leetcodeAnalysis.topTags.some((tag) =>
      containsAlias(tag.name, area.leetcodeAliases),
    );

    if (hasTag) {
      const recentForArea = input.leetcodeAnalysis.recentSubmissions.find((submission) =>
        containsAlias(submission.title, area.aliases),
      );
      touchedDates.push(
        new Date(recentForArea?.timestamp ?? input.leetcodeAnalysis.analyzedAt),
      );
    }
  }

  if (touchedDates.length === 0) {
    return null;
  }

  return touchedDates.sort((left, right) => right.getTime() - left.getTime())[0];
}

export function buildSkillGapAnalysis(input: BuildSkillGapInput): SkillGapAnalysisRecord {
  const now = input.now ?? new Date();
  const insights: SkillGapAnalysisRecord["insights"] = [];
  const recommendations = new Set<string>();

  const activityAnchor =
    latestDate([
      ...input.reflections.map((entry) => entry.created_at),
      ...input.projectUpdates.map((entry) => entry.created_at),
      input.githubAnalysis?.analyzedAt,
      input.leetcodeAnalysis?.analyzedAt,
    ]) ?? now;

  const activeTrackedAreas = input.trackedAreasConfig && input.trackedAreasConfig.length > 0
    ? input.trackedAreasConfig.map(area => ({
        name: area.name,
        aliases: area.aliases,
        leetcodeAliases: area.aliases,
      }))
    : TRACKED_AREAS;

  const trackedAreas = activeTrackedAreas.map((area) => {
    const lastTouchedAt = getLastTouchedDate(area, input);
    const daysSinceTouched = lastTouchedAt ? daysBetween(lastTouchedAt, activityAnchor) : 999;

    let signal: "healthy" | "warning" | "gap" = "healthy";
    if (daysSinceTouched >= 6) {
      signal = "gap";
    } else if (daysSinceTouched >= 3) {
      signal = "warning";
    }

    if (signal === "gap") {
      const title = `${area.name} is being avoided`;
      const message = lastTouchedAt
        ? `You've avoided ${area.name.toLowerCase()} for ${daysSinceTouched} days. That is likely a core weakness right now.`
        : `No clear practice signals found for ${area.name.toLowerCase()} yet. This is likely a blind spot.`;

      insights.push({
        id: `avoid-${area.name.toLowerCase().replace(/\s+/g, "-")}`,
        title,
        message,
        severity: "high",
        evidence: buildEvidenceList([
          lastTouchedAt
            ? `Last touched on ${lastTouchedAt.toLocaleDateString()}`
            : "No direct mentions in recent reflections, project updates, or skill history",
          "Threshold: 6+ days without signals",
        ]),
      });

      recommendations.add(`Schedule one focused ${area.name.toLowerCase()} session tomorrow.`);
    }

    return {
      area: area.name,
      lastTouchedAt: lastTouchedAt ? lastTouchedAt.toISOString() : null,
      daysSinceTouched,
      signal,
    };
  });

  if (input.leetcodeAnalysis) {
    const total = input.leetcodeAnalysis.solvedCount.total;
    const easy = input.leetcodeAnalysis.solvedCount.easy;
    const medium = input.leetcodeAnalysis.solvedCount.medium;
    const hard = input.leetcodeAnalysis.solvedCount.hard;
    const easyRatio = total > 0 ? easy / total : 0;

    if (total >= 15 && easyRatio >= 0.7 && medium + hard <= Math.max(5, Math.floor(total * 0.35))) {
      insights.push({
        id: "leetcode-easy-heavy",
        title: "Difficulty distribution is too easy-heavy",
        message:
          "You are mostly solving easy LeetCode problems. Growth is likely bottlenecked by low medium/hard exposure.",
        severity: "medium",
        evidence: buildEvidenceList([
          `Solved: ${easy} easy / ${medium} medium / ${hard} hard`,
          `Easy ratio: ${Math.round(easyRatio * 100)}%`,
        ]),
      });

      recommendations.add("Add a rule: at least one medium-or-harder problem each day.");
    }

    const dpCount = input.leetcodeAnalysis.topTags
      .filter((tag) => containsAlias(tag.name, ["dynamic programming", "dp"]))
      .reduce((sum, tag) => sum + tag.solved, 0);
    if (total >= 20 && dpCount / Math.max(total, 1) < 0.1) {
      insights.push({
        id: "leetcode-low-dp",
        title: "Dynamic Programming coverage is low",
        message:
          "DP appears under-practiced compared to your total solved set. This may explain slower progress on tougher problems.",
        severity: "high",
        evidence: buildEvidenceList([
          `DP-tag solved: ${dpCount}`,
          `Total solved: ${total}`,
        ]),
      });

      recommendations.add("Run a 7-day DP cycle with one pattern per day.");
    }
  }

  // Only run System Design check if the user is using GitHub or has developer-oriented tracked areas
  const isDevUser = input.githubAnalysis !== null || 
    input.leetcodeAnalysis !== null || 
    activeTrackedAreas.some(area => containsAlias(area.name, ["system design", "programming", "software", "coding", "developer", "engineering"]));

  if (isDevUser) {
    const systemDesignSkill = input.skills.some((skill) =>
      containsAlias(skill.name, ["system design", "distributed", "architecture"]),
    );
    const githubDesignSignal = Boolean(
      input.githubAnalysis?.inferredSkills.some((skill) =>
        containsAlias(skill, ["system design", "backend systems"]),
      ) ||
        input.githubAnalysis?.sampleRepos.some((repo) =>
          repo.topics.some((topic) => containsAlias(topic, ["system-design", "architecture"])),
        ),
    );

    if (!systemDesignSkill && !githubDesignSignal) {
      insights.push({
        id: "system-design-signal-missing",
        title: "System design practice is missing",
        message:
          "There are no strong recent system design signals in your skill log or GitHub profile. This can become a bottleneck as problem difficulty increases.",
        severity: "medium",
        evidence: buildEvidenceList([
          "No system-design-like skill entries detected",
          "No system-design-like repository topics inferred",
        ]),
      });
      recommendations.add("Add one weekly system design drill (API + data model + scaling notes).");
    }
  }

  if (insights.length === 0) {
    recommendations.add("Keep balancing fundamentals, problem solving, and project depth.");
  }

  const primaryWeakness =
    insights
      .sort((left, right) => {
        const weight = { high: 3, medium: 2, low: 1 };
        return weight[right.severity] - weight[left.severity];
      })[0]
      ?.title ?? null;

  return {
    generatedAt: now.toISOString(),
    primaryWeakness,
    insights,
    recommendations: Array.from(recommendations),
    coverage: {
      trackedAreas,
      github: input.githubAnalysis
        ? {
            repoCount: input.githubAnalysis.repoCount,
            inferredSkillCount: input.githubAnalysis.inferredSkills.length,
            topLanguages: input.githubAnalysis.topLanguages,
          }
        : null,
      leetcode: input.leetcodeAnalysis
        ? {
            totalSolved: input.leetcodeAnalysis.solvedCount.total,
            easy: input.leetcodeAnalysis.solvedCount.easy,
            medium: input.leetcodeAnalysis.solvedCount.medium,
            hard: input.leetcodeAnalysis.solvedCount.hard,
            easyRatio:
              input.leetcodeAnalysis.solvedCount.total > 0
                ? input.leetcodeAnalysis.solvedCount.easy /
                  input.leetcodeAnalysis.solvedCount.total
                : 0,
            topTags: input.leetcodeAnalysis.topTags,
          }
        : null,
    },
  };
}
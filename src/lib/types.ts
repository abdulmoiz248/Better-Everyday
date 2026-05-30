export type SkillStatus = "pending" | "learning" | "completed";
export type ProjectStatus = "future" | "active" | "completed";

export type SkillRecord = {
  id: string;
  user_id: string;
  name: string;
  status: SkillStatus;
  created_at: string;
  updated_at: string;
};

export type ReflectionRecord = {
  id: string;
  user_id: string;
  learned_today: string;
  leetcode_question: string | null;
  blockers: string | null;
  wins: string | null;
  custom_fields: Record<string, string> | null;
  created_at: string;
};

export type CheckinTokenRecord = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type ProfileRecord = {
  user_id: string;
  email: string;
  full_name: string | null;
  github_username: string | null;
  github_analysis: GitHubAnalysisRecord | null;
  github_synced_at: string | null;
  leetcode_username: string | null;
  leetcode_analysis: LeetCodeAnalysisRecord | null;
  skill_gap_analysis: SkillGapAnalysisRecord | null;
  skill_gap_synced_at: string | null;
  current_streak: number;
  longest_streak: number;
  streak_last_updated: string | null;
  last_weekly_review_date: string | null;
  created_at: string;
  updated_at: string;
};

export type GitHubAnalysisRecord = {
  username: string;
  analyzedAt: string;
  repoCount: number;
  starCount: number;
  topLanguages: Array<{ name: string; count: number }>;
  inferredSkills: string[];
  sampleRepos: Array<{
    name: string;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    topics: string[];
  }>;
};

export type LeetCodeAnalysisRecord = {
  username: string;
  analyzedAt: string;
  solvedCount: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
  };
  topTags: Array<{
    name: string;
    solved: number;
  }>;
  recentSubmissions: Array<{
    title: string;
    titleSlug: string;
    timestamp: string;
    statusDisplay: string;
    lang: string;
  }>;
};

export type SkillGapInsightSeverity = "high" | "medium" | "low";

export type SkillGapInsight = {
  id: string;
  title: string;
  message: string;
  severity: SkillGapInsightSeverity;
  evidence: string[];
};

export type SkillAreaCoverage = {
  area: string;
  lastTouchedAt: string | null;
  daysSinceTouched: number;
  signal: "healthy" | "warning" | "gap";
};

export type SkillGapAnalysisRecord = {
  generatedAt: string;
  primaryWeakness: string | null;
  insights: SkillGapInsight[];
  recommendations: string[];
  coverage: {
    trackedAreas: SkillAreaCoverage[];
    github: {
      repoCount: number;
      inferredSkillCount: number;
      topLanguages: Array<{ name: string; count: number }>;
    } | null;
    leetcode: {
      totalSolved: number;
      easy: number;
      medium: number;
      hard: number;
      easyRatio: number;
      topTags: Array<{ name: string; solved: number }>;
    } | null;
  };
};

export type ProjectRecord = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  progress_percent: number;
  current_focus: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
};

export type ProjectUpdateRecord = {
  id: string;
  project_id: string;
  user_id: string;
  update_note: string;
  learned: string | null;
  stats: string | null;
  progress_percent: number | null;
  created_at: string;
};
export type WeeklyReviewRecord = {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  total_hours: number | null;
  problems_solved: number | null;
  skills_improved: string[] | null;
  missed_days: number | null;
  depth_score: number | null;
  consistency_score: number | null;
  variety_score: number | null;
  brutal_reflection: string | null;
  llm_feedback: string | null;
  created_at: string;
  updated_at: string;
};

export type StreakMetrics = {
  current_streak: number;
  longest_streak: number;
  streak_last_updated: string | null;
};

export type WeeklyMetrics = {
  depthScore: number;
  consistencyScore: number;
  varietyScore: number;
  totalHours: number;
  problemsSolved: number;
  skillsImproved: string[];
  missedDays: number;
};

/* ── Customization types ── */

export type CheckinFieldType = "text" | "textarea" | "number";

export type CheckinField = {
  id: string;
  label: string;
  type: CheckinFieldType;
  required: boolean;
  placeholder?: string;
};

export type TrackedAreaConfig = {
  name: string;
  aliases: string[];
};

export type IntegrationsConfig = {
  github: boolean;
  leetcode: boolean;
};

export type UserSettingsRecord = {
  user_id: string;
  checkin_fields: CheckinField[];
  tracked_areas: TrackedAreaConfig[];
  review_context: string;
  timezone: string;
  integrations: IntegrationsConfig;
  created_at: string;
  updated_at: string;
};

/** Default check-in fields for new users */
export const DEFAULT_CHECKIN_FIELDS: CheckinField[] = [
  { id: "learned", label: "What did you learn today?", type: "textarea", required: true, placeholder: "Today I learned about..." },
  { id: "practice", label: "What did you practice?", type: "text", required: false, placeholder: "e.g. Piano scales, essay writing, algorithm problems..." },
  { id: "wins", label: "What went well?", type: "textarea", required: false, placeholder: "Wins, progress, small victories..." },
  { id: "blockers", label: "Any blockers or challenges?", type: "textarea", required: false, placeholder: "What slowed you down..." },
];
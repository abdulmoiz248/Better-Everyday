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

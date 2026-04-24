export type GitHubRepoSummary = {
  name: string;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  topics: string[];
};

export type GitHubAnalysis = {
  username: string;
  analyzedAt: string;
  repoCount: number;
  starCount: number;
  topLanguages: Array<{ name: string; count: number }>;
  inferredSkills: string[];
  sampleRepos: GitHubRepoSummary[];
};

const LANGUAGE_SKILL_MAP: Record<string, string[]> = {
  TypeScript: ["React", "Next.js", "frontend engineering"],
  JavaScript: ["Node.js", "frontend engineering"],
  Python: ["Python", "automation", "data work"],
  Go: ["Go", "backend systems"],
  Java: ["Java", "backend development"],
  Kotlin: ["Kotlin", "Android"],
  Swift: ["Swift", "iOS"],
  Rust: ["Rust", "systems programming"],
  C: ["C", "low-level programming"],
  "C++": ["C++", "systems programming"],
  PHP: ["PHP", "web development"],
  Ruby: ["Ruby", "web development"],
  SQL: ["SQL", "databases"],
  Dart: ["Dart", "Flutter"],
};

const TOPIC_SKILL_MAP: Record<string, string[]> = {
  react: ["React"],
  nextjs: ["Next.js"],
  nodejs: ["Node.js"],
  express: ["Express.js"],
  nestjs: ["NestJS"],
  django: ["Django"],
  fastapi: ["FastAPI"],
  flask: ["Flask"],
  spring: ["Spring Boot"],
  android: ["Android"],
  ios: ["iOS"],
  flutter: ["Flutter"],
  machinelearning: ["machine learning"],
  "machine-learning": ["machine learning"],
  data: ["data work"],
  algorithm: ["problem solving"],
  leetcode: ["problem solving"],
  aws: ["AWS"],
  docker: ["Docker"],
  kubernetes: ["Kubernetes"],
  graphql: ["GraphQL"],
  postgres: ["PostgreSQL"],
};

function normalizeUsername(username: string) {
  return username.trim().replace(/^@/, "");
}

function getGitHubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "BetterEveryday-App",
  };

  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function inferSkillsFromRepos(repos: GitHubRepoSummary[]) {
  const inferred = new Set<string>();

  for (const repo of repos) {
    if (repo.language && LANGUAGE_SKILL_MAP[repo.language]) {
      for (const skill of LANGUAGE_SKILL_MAP[repo.language]) {
        inferred.add(skill);
      }
    }

    for (const topic of repo.topics) {
      const normalized = topic.toLowerCase().replace(/[^a-z0-9-]/g, "");
      const topicSkills = TOPIC_SKILL_MAP[normalized] ?? TOPIC_SKILL_MAP[normalized.replace(/-/g, "")];
      if (topicSkills) {
        for (const skill of topicSkills) {
          inferred.add(skill);
        }
      }
    }
  }

  return Array.from(inferred);
}

export async function fetchGitHubAnalysis(rawUsername: string) {
  const username = normalizeUsername(rawUsername);

  if (!username) {
    throw new Error("GitHub username is required");
  }

  const repos: GitHubRepoSummary[] = [];
  const topLanguages = new Map<string, number>();
  let starCount = 0;

  for (let page = 1; page <= 3; page += 1) {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=updated`,
      {
        headers: getGitHubHeaders(),
        cache: "no-store",
      },
    );

    if (response.status === 404) {
      throw new Error("GitHub user not found");
    }

    if (!response.ok) {
      throw new Error(`GitHub API request failed with status ${response.status}`);
    }

    const pageRepos = (await response.json()) as Array<{
      name: string;
      html_url: string;
      language: string | null;
      stargazers_count: number;
      topics?: string[];
    }>;

    for (const repo of pageRepos) {
      repos.push({
        name: repo.name,
        html_url: repo.html_url,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        topics: repo.topics ?? [],
      });

      starCount += repo.stargazers_count;
      if (repo.language) {
        topLanguages.set(repo.language, (topLanguages.get(repo.language) ?? 0) + 1);
      }
    }

    if (pageRepos.length < 100) {
      break;
    }
  }

  const orderedLanguages = Array.from(topLanguages.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  return {
    username,
    analyzedAt: new Date().toISOString(),
    repoCount: repos.length,
    starCount,
    topLanguages: orderedLanguages,
    inferredSkills: inferSkillsFromRepos(repos),
    sampleRepos: repos.slice(0, 6),
  } satisfies GitHubAnalysis;
}

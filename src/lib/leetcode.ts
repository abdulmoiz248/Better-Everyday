export type LeetCodeTagCoverage = {
  name: string;
  solved: number;
};

export type LeetCodeAnalysis = {
  username: string;
  analyzedAt: string;
  solvedCount: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
  };
  topTags: LeetCodeTagCoverage[];
  recentSubmissions: Array<{
    title: string;
    titleSlug: string;
    timestamp: string;
    statusDisplay: string;
    lang: string;
  }>;
};

type LeetCodeDifficultyCount = {
  difficulty: string;
  count: number;
};

function normalizeUsername(username: string) {
  return username.trim().replace(/^@/, "");
}

function parseDifficultyCounts(items: LeetCodeDifficultyCount[]) {
  const bucket = {
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  };

  for (const item of items) {
    const difficulty = item.difficulty.toLowerCase();
    const count = Number(item.count ?? 0);

    if (difficulty === "all") {
      bucket.total = count;
    } else if (difficulty === "easy") {
      bucket.easy = count;
    } else if (difficulty === "medium") {
      bucket.medium = count;
    } else if (difficulty === "hard") {
      bucket.hard = count;
    }
  }

  if (!bucket.total) {
    bucket.total = bucket.easy + bucket.medium + bucket.hard;
  }

  return bucket;
}

export async function fetchLeetCodeAnalysis(rawUsername: string) {
  const username = normalizeUsername(rawUsername);

  if (!username) {
    throw new Error("LeetCode username is required");
  }

  const query = `
    query betterEverydayUser($username: String!) {
      matchedUser(username: $username) {
        username
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        tagProblemCounts {
          advanced {
            tagName
            problemsSolved
          }
          intermediate {
            tagName
            problemsSolved
          }
          fundamental {
            tagName
            problemsSolved
          }
        }
      }
      recentSubmissionList(username: $username) {
        title
        titleSlug
        timestamp
        statusDisplay
        lang
      }
    }
  `;

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
    },
    body: JSON.stringify({
      query,
      variables: {
        username,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`LeetCode API request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: {
      matchedUser?: {
        username: string;
        submitStatsGlobal?: {
          acSubmissionNum?: LeetCodeDifficultyCount[];
        };
        tagProblemCounts?: {
          advanced?: Array<{ tagName: string; problemsSolved: number }>;
          intermediate?: Array<{ tagName: string; problemsSolved: number }>;
          fundamental?: Array<{ tagName: string; problemsSolved: number }>;
        };
      };
      recentSubmissionList?: Array<{
        title: string;
        titleSlug: string;
        timestamp: string;
        statusDisplay: string;
        lang: string;
      }>;
    };
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || "LeetCode API returned an error");
  }

  const user = payload.data?.matchedUser;
  if (!user) {
    throw new Error("LeetCode user not found or private");
  }

  const solvedCount = parseDifficultyCounts(user.submitStatsGlobal?.acSubmissionNum ?? []);

  const rawTags = [
    ...(user.tagProblemCounts?.advanced ?? []),
    ...(user.tagProblemCounts?.intermediate ?? []),
    ...(user.tagProblemCounts?.fundamental ?? []),
  ];

  const tagMap = new Map<string, number>();
  for (const item of rawTags) {
    const name = item.tagName.trim();
    const solved = Number(item.problemsSolved ?? 0);
    if (!name || solved <= 0) {
      continue;
    }

    tagMap.set(name, (tagMap.get(name) ?? 0) + solved);
  }

  const topTags = Array.from(tagMap.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 12)
    .map(([name, solved]) => ({ name, solved }));

  const recentSubmissions = (payload.data?.recentSubmissionList ?? [])
    .filter((submission) => submission?.title && submission?.timestamp)
    .slice(0, 15)
    .map((submission) => ({
      title: submission.title,
      titleSlug: submission.titleSlug,
      timestamp: new Date(Number(submission.timestamp) * 1000).toISOString(),
      statusDisplay: submission.statusDisplay,
      lang: submission.lang,
    }));

  return {
    username: user.username,
    analyzedAt: new Date().toISOString(),
    solvedCount,
    topTags,
    recentSubmissions,
  } satisfies LeetCodeAnalysis;
}
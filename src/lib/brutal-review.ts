import { WeeklyMetrics } from "@/lib/types";

type BrutalReviewInput = {
  username: string;
  weekStartDate: Date;
  weekEndDate: Date;
  metrics: WeeklyMetrics;
};

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Failed to generate brutal review.";

  return text;
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 1,
      max_tokens: 1024,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const text =
    data.choices?.[0]?.message?.content ||
    "Failed to generate brutal review.";

  return text;
}

export async function generateBrutalReview(input: BrutalReviewInput): Promise<string> {
  const weekDateRange = `${input.weekStartDate.toLocaleDateString()} to ${input.weekEndDate.toLocaleDateString()}`;

  const prompt = `You are a brutally honest mentor who is tired of motivational BS. Generate a HARSH, UNCOMFORTABLE weekly review for someone named "${input.username}".

Week: ${weekDateRange}

METRICS:
- Depth Score (easy vs hard problems): ${input.metrics.depthScore}/100
- Consistency (daily checkins): ${input.metrics.consistencyScore}/100
- Variety (topic diversity): ${input.metrics.varietyScore}/100
- Total Hours Spent: ${input.metrics.totalHours}
- Problems Solved: ${input.metrics.problemsSolved}
- Skills Improved: ${input.metrics.skillsImproved.join(", ") || "None"}
- Missed Days: ${input.metrics.missedDays}

RULES FOR YOUR RESPONSE:
1. DO NOT be motivational or encouraging
2. DO NOT use phrases like "Great job!" or "Keep it up!"
3. DO focus on hard truths and areas of failure
4. DO be specific about weaknesses
5. DO ask uncomfortable questions:
   - "Why did you waste time?"
   - "What are you actually avoiding?"
   - "Is this really a priority for you?"
6. DO point out patterns (consistency failures, easy-problem bias, etc.)
7. DO be short and direct (max 200 words)
8. DO calculate what 1% daily improvement means for the year (1.01^365 vs 0.99^365)

Generate the brutal review now. Be harsh. Be real. No fluff.`;

  const llmProvider = process.env.LLM_PROVIDER || "gemini";

  try {
    if (llmProvider === "groq") {
      return await callGroq(prompt);
    }

    return await callGemini(prompt);
  } catch (err) {
    console.error("LLM generation failed:", err);
    // Fallback: return deterministic harsh feedback
    return generateFallbackBrutalReview(input);
  }
}

function generateFallbackBrutalReview(input: BrutalReviewInput): string {
  const lines: string[] = [];

  lines.push(`Week of ${input.weekStartDate.toLocaleDateString()}:`);
  lines.push("");

  if (input.metrics.consistencyScore < 50) {
    lines.push(
      `You missed ${input.metrics.missedDays} days. That is not a commitment—that is a hobby.`,
    );
  }

  if (input.metrics.depthScore < 40) {
    lines.push("You're solving only easy problems. Growth stopped after day 3.");
  }

  if (input.metrics.varietyScore < 50) {
    lines.push(
      "Only ${input.metrics.skillsImproved.length} skill areas touched. You're stagnating in comfort zones.",
    );
  }

  if (input.metrics.totalHours < 5) {
    lines.push(
      `${input.metrics.totalHours} hours in a week? That's 14 minutes per day on average.`,
    );
  }

  lines.push("");
  lines.push(
    "Remember: 1% better daily = 37x better in a year. 1% worse = 97% of nothing. You're choosing.",
  );

  return lines.join("\n");
}

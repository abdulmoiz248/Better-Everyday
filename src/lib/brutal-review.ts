import { WeeklyMetrics } from "@/lib/types";
import { GoogleGenAI } from "@google/genai";

type BrutalReviewInput = {
  username: string;
  weekStartDate: Date;
  weekEndDate: Date;
  metrics: WeeklyMetrics;
  reviewContext?: string;
};

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini API returned empty response");
  }

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

  const contextSection = input.reviewContext
    ? `USER FOCUS CONTEXT (Crucial: prioritize feedback relevant to this domain):
${input.reviewContext}`
    : "USER FOCUS CONTEXT: General personal growth, productivity, and habit tracking.";

  const prompt = `You are a brutally honest mentor who is tired of motivational BS. Generate a HARSH, UNCOMFORTABLE weekly review for someone named "${input.username}".

${contextSection}

Week: ${weekDateRange}

METRICS:
- Consistency Score (daily checkins): ${input.metrics.consistencyScore}/100
- Variety Score (topic/skill diversity): ${input.metrics.varietyScore}/100
- Depth/Focus Score (challenge difficulty / hard vs easy ratio): ${input.metrics.depthScore}/100
- Total Hours Spent on Growth: ${input.metrics.totalHours} hours
- Practice sessions / items logged: ${input.metrics.problemsSolved}
- Skills/Topics practicing: ${input.metrics.skillsImproved.join(", ") || "None"}
- Missed Days: ${input.metrics.missedDays}

RULES FOR YOUR RESPONSE:
1. DO NOT be motivational or encouraging.
2. DO NOT use phrases like "Great job!" or "Keep it up!"
3. DO focus on hard truths and areas of failure.
4. DO be specific about weaknesses and stagnation.
5. DO ask uncomfortable questions:
   - "Why did you waste time?"
   - "What are you actually avoiding?"
   - "Is this really a priority for you?"
6. DO point out patterns (consistency failures, staying in comfort zones, avoidance, low hours).
7. DO be short and direct (max 200 words).
8. DO calculate what 1% daily improvement means for the year (1.01^365 = 37.8x growth vs 0.99^365 = 0.03x decay) and how their metrics place them on this path.

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
      `Only ${input.metrics.skillsImproved.length} skill areas touched. You're stagnating in comfort zones.`,
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

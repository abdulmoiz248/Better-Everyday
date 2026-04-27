import { createCheckinTokenForUser, sendCheckinEmail } from "@/lib/checkin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function unauthorized(message: string) {
  return Response.json({ error: message }, { status: 401 });
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return Response.json(
      { error: "Missing CRON_SECRET environment variable" },
      { status: 500 },
    );
  }

  if (authorization !== `Bearer ${expected}`) {
    return unauthorized("Invalid authorization");
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id, email, current_streak")
    .not("email", "is", null);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const sent: string[] = [];
  const errors: Array<{ email: string; error: string }> = [];

  for (const profile of profiles ?? []) {
    try {
      const token = await createCheckinTokenForUser(profile.user_id, profile.email);
      const checkinLink = `${appUrl}/check-in/${token}`;

      // Fetch yesterday's reflection for context
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setUTCHours(0, 0, 0, 0);

      const tomorrow = new Date(yesterday);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

      const { data: lastReflection } = await supabaseAdmin
        .from("daily_reflections")
        .select("learned_today, created_at")
        .eq("user_id", profile.user_id)
        .gte("created_at", yesterday.toISOString())
        .lt("created_at", tomorrow.toISOString())
        .maybeSingle();

      await sendCheckinEmail({
        to: profile.email,
        checkinLink,
        currentStreak: profile.current_streak || 0,
        lastReflection: lastReflection || null,
      });

      sent.push(profile.email);
    } catch (err) {
      errors.push({
        email: profile.email,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return Response.json({
    ok: true,
    sentCount: sent.length,
    errorCount: errors.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeAndSaveWeeklyReview } from "@/app/actions/weekly-review";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    // Expect { userId, weekStartDate, weekEndDate } in body, or compute current week
    const body = await request.json().catch(() => ({}));

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Allow override for testing, but default to requesting user's ID
    const userId = body.userId || user.id;

    // Security: only allow users to generate their own reviews
    if (body.userId && body.userId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate week range (default: last 7 days)
    const now = new Date();
    const weekStartDate = body.weekStartDate
      ? new Date(body.weekStartDate)
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekEndDate = body.weekEndDate ? new Date(body.weekEndDate) : now;

    // Generate and save weekly review
    const result = await computeAndSaveWeeklyReview(userId, weekStartDate, weekEndDate);

    return Response.json({
      ok: true,
      message: "Weekly review generated successfully",
      review: result,
    });
  } catch (error) {
    console.error("Error generating weekly review:", error);
    return Response.json(
      { error: String(error) },
      { status: 500 },
    );
  }
}

// For cron-triggered admin generation (all users)
export async function PUT(request: Request) {
  try {
    // Protected by CRON_SECRET header
    const secret = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (secret !== process.env.CRON_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Get all users with active profiles
    const { data: profiles } = await admin.from("profiles").select("user_id");

    if (!profiles || profiles.length === 0) {
      return Response.json({ ok: true, generated: 0 });
    }

    const now = new Date();
    const weekStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const results = [];
    for (const profile of profiles) {
      try {
        const result = await computeAndSaveWeeklyReview(profile.user_id, weekStartDate, now);
        results.push({ userId: profile.user_id, ok: true, data: result });
      } catch (err) {
        console.error(`Failed for user ${profile.user_id}:`, err);
        results.push({ userId: profile.user_id, ok: false, error: String(err) });
      }
    }

    const successCount = results.filter((r) => r.ok).length;
    const failCount = results.filter((r) => !r.ok).length;

    return Response.json({
      ok: true,
      generated: successCount,
      failed: failCount,
      details: results,
    });
  } catch (error) {
    console.error("Error in cron weekly reviews:", error);
    return Response.json(
      { error: String(error) },
      { status: 500 },
    );
  }
}

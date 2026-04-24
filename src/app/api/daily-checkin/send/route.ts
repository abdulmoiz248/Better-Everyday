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
    .select("user_id, email")
    .not("email", "is", null);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const sent: string[] = [];

  for (const profile of profiles ?? []) {
    const token = await createCheckinTokenForUser(profile.user_id, profile.email);
    const checkinLink = `${appUrl}/check-in/${token}`;

    await sendCheckinEmail({
      to: profile.email,
      checkinLink,
    });

    sent.push(profile.email);
  }

  return Response.json({ ok: true, sentCount: sent.length, sent });
}

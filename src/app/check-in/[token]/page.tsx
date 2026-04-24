import { submitDailyCheckin } from "@/app/actions";
import { hashToken } from "@/lib/checkin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export default async function CheckinPage({ params }: Props) {
  const { token } = await params;
  const tokenHash = hashToken(token);
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: tokenRow } = await supabaseAdmin
    .from("checkin_tokens")
    .select("id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  const isInvalid = !tokenRow;
  const isUsed = !!tokenRow?.used_at;
  const isExpired = tokenRow ? new Date(tokenRow.expires_at) < new Date() : false;

  if (isInvalid || isUsed || isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-zinc-900">Link unavailable</h1>
          <p className="mt-2 text-sm text-zinc-600">
            This check-in link is invalid, already used, or expired after 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Daily check-in</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Share what you learned today. This link works only for this one check-in.
        </p>

        <form action={submitDailyCheckin} className="mt-6 space-y-4">
          <input type="hidden" name="token" value={token} />

          <div>
            <label htmlFor="learnedToday" className="text-sm font-medium text-zinc-800">
              What did you learn today?
            </label>
            <textarea
              id="learnedToday"
              name="learnedToday"
              required
              rows={4}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="leetcodeQuestion"
              className="text-sm font-medium text-zinc-800"
            >
              Which LeetCode question did you solve today?
            </label>
            <input
              id="leetcodeQuestion"
              name="leetcodeQuestion"
              placeholder="e.g. Two Sum (#1)"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="wins" className="text-sm font-medium text-zinc-800">
              What went well today?
            </label>
            <textarea
              id="wins"
              name="wins"
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="blockers" className="text-sm font-medium text-zinc-800">
              Any blockers?
            </label>
            <textarea
              id="blockers"
              name="blockers"
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Submit daily check-in
          </button>
        </form>
      </div>
    </div>
  );
}

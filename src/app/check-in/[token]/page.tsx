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
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        <div className="ambient-bg" />
        <div className="glass-card" style={{ maxWidth: 480, width: "100%", position: "relative", zIndex: 1 }}>
          <div className="glass-card-body" style={{ textAlign: "center", padding: "48px 32px" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>⏰</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Link unavailable
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              This check-in link is invalid, already used, or expired after 24 hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 16px",
      }}
    >
      <div className="ambient-bg" />
      <div
        className="glass-card"
        style={{
          maxWidth: 640,
          width: "100%",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="glass-card-body" style={{ padding: "32px" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-muted)", marginBottom: 6 }}>
              BetterEveryday
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Daily Check-in ✅
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Share what you learned today. This link works only once.
            </p>
          </div>

          <form action={submitDailyCheckin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <input type="hidden" name="token" value={token} />

            <div className="form-group">
              <label htmlFor="learnedToday" className="form-label">
                What did you learn today? <span style={{ color: "#f87171" }}>*</span>
              </label>
              <textarea
                id="learnedToday"
                name="learnedToday"
                required
                rows={4}
                className="textarea"
                placeholder="Today I learned about..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="leetcodeQuestion" className="form-label">
                Which LeetCode question did you solve?
              </label>
              <input
                id="leetcodeQuestion"
                name="leetcodeQuestion"
                placeholder="e.g. Two Sum (#1)"
                className="input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="wins" className="form-label">
                What went well today?
              </label>
              <textarea
                id="wins"
                name="wins"
                rows={3}
                className="textarea"
                placeholder="Wins, progress, small victories..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="blockers" className="form-label">
                Any blockers?
              </label>
              <textarea
                id="blockers"
                name="blockers"
                rows={3}
                className="textarea"
                placeholder="What slowed you down..."
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
              Submit daily check-in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

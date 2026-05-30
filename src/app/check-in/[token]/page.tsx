import { submitDailyCheckin } from "@/app/actions";
import { hashToken } from "@/lib/checkin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_CHECKIN_FIELDS } from "@/lib/types";
import type { CheckinField, UserSettingsRecord } from "@/lib/types";

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
    .select("id, user_id, expires_at, used_at")
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

  // Fetch user's custom check-in fields
  const { data: settingsData } = await supabaseAdmin
    .from("user_settings")
    .select("checkin_fields")
    .eq("user_id", tokenRow.user_id)
    .maybeSingle();

  const settings = settingsData as Pick<UserSettingsRecord, "checkin_fields"> | null;
  const checkinFields: CheckinField[] = settings?.checkin_fields ?? DEFAULT_CHECKIN_FIELDS;

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
              Record your progress for today. This link works only once.
            </p>
          </div>

          <form action={submitDailyCheckin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <input type="hidden" name="token" value={token} />

            {checkinFields.map((field) => (
              <div key={field.id} className="form-group">
                <label htmlFor={`checkin-${field.id}`} className="form-label">
                  {field.label}{" "}
                  {field.required && <span style={{ color: "#f87171" }}>*</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={`checkin-${field.id}`}
                    name={`custom_${field.id}`}
                    required={field.required}
                    rows={field.required ? 4 : 3}
                    className="textarea"
                    placeholder={field.placeholder ?? ""}
                  />
                ) : field.type === "number" ? (
                  <input
                    id={`checkin-${field.id}`}
                    name={`custom_${field.id}`}
                    type="number"
                    required={field.required}
                    className="input"
                    placeholder={field.placeholder ?? ""}
                  />
                ) : (
                  <input
                    id={`checkin-${field.id}`}
                    name={`custom_${field.id}`}
                    type="text"
                    required={field.required}
                    className="input"
                    placeholder={field.placeholder ?? ""}
                  />
                )}
              </div>
            ))}

            <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
              Submit daily check-in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

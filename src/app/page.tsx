import { redirect } from "next/navigation";
import { GoogleLoginButton } from "@/components/google-login-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div className="ambient-bg" />

      <main
        style={{
          width: "100%",
          maxWidth: 440,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Card */}
        <div
          className="glass-card"
          style={{ textAlign: "center" }}
        >
          <div className="glass-card-body" style={{ padding: "48px 36px" }}>
            {/* Logo text */}
            <div
              style={{
                fontSize: "0.625rem",
                textTransform: "uppercase",
                letterSpacing: "3px",
                color: "var(--text-muted)",
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Daily Growth Tracker
            </div>

            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #6c5ce7, #a855f7, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1.2,
                letterSpacing: "-0.03em",
                marginBottom: 8,
              }}
            >
              BetterEveryday
            </h1>

            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: 32,
              }}
            >
              Track skills, build projects, analyze gaps, and get
              brutally honest weekly reviews. Compound your growth —
              <span style={{ color: "#34d399", fontWeight: 600 }}> 1.01</span>
              <sup style={{ fontSize: "0.625rem", color: "#34d399" }}>365</sup>
              <span style={{ color: "var(--text-muted)" }}> = 37.8×</span>
            </p>

            {/* Feature pills */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                justifyContent: "center",
                marginBottom: 32,
              }}
            >
              <span className="tag tag-blue">Skill Tracker</span>
              <span className="tag tag-green">Streak System</span>
              <span className="tag tag-purple">LLM Reviews</span>
              <span className="tag tag-amber">GitHub Insights</span>
            </div>

            <GoogleLoginButton />

            <p
              style={{
                fontSize: "0.6875rem",
                color: "var(--text-muted)",
                marginTop: 16,
              }}
            >
              Sign in with Google to start tracking
            </p>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            marginTop: 24,
          }}
        >
          1% better every day. No excuses.
        </p>
      </main>
    </div>
  );
}

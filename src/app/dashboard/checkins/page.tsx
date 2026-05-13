import { redirect } from "next/navigation";
import { requestMyCheckinLink } from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReflectionRecord, ProfileRecord } from "@/lib/types";

export default async function CheckinsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: reflectionsData }, { data: profileData }] = await Promise.all([
    supabase
      .from("daily_reflections")
      .select(
        "id, user_id, learned_today, leetcode_question, blockers, wins, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("profiles")
      .select("current_streak, longest_streak, streak_last_updated")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const reflections = (reflectionsData ?? []) as ReflectionRecord[];
  const profile = profileData as Pick<ProfileRecord, "current_streak" | "longest_streak" | "streak_last_updated"> | null;

  return (
    <>
      <div className="page-header animate-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>Check-ins</h1>
          <p>Your daily reflections and learning journal.</p>
        </div>
        <form action={requestMyCheckinLink}>
          <button type="submit" className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Send check-in email
          </button>
        </form>
      </div>

      {/* Streak Banner */}
      <div className="glass-card animate-in animate-delay-1" style={{ marginBottom: 24 }}>
        <div className="glass-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: "2.5rem" }} className="streak-fire">🔥</div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fb923c" }} className="streak-fire">
                {profile?.current_streak ?? 0} day streak
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Longest streak: {profile?.longest_streak ?? 0} days
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--text-primary)" }}>{reflections.length}</div>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Entries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reflections List */}
      <div className="glass-card animate-in animate-delay-2">
        <div className="glass-card-body">
          <h2 className="section-title" style={{ marginBottom: 4 }}>Daily Reflections</h2>
          <p className="section-subtitle" style={{ marginBottom: 20 }}>Your last 30 check-in responses</p>

          {reflections.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p className="empty-state-text">No check-ins submitted yet. Request a check-in email to get started!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reflections.map((entry) => (
                <div key={entry.id} className="list-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(entry.created_at).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {entry.leetcode_question && (
                      <span className="tag tag-purple">
                        🧩 {entry.leetcode_question}
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                      What I Learned
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
                      {entry.learned_today}
                    </p>
                  </div>

                  {(entry.wins || entry.blockers) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {entry.wins && (
                        <div>
                          <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#34d399", marginBottom: 4 }}>
                            ✅ Wins
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{entry.wins}</p>
                        </div>
                      )}
                      {entry.blockers && (
                        <div>
                          <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#f87171", marginBottom: 4 }}>
                            🚫 Blockers
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{entry.blockers}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

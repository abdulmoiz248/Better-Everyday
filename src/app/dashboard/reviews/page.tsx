import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WeeklyReviewRecord } from "@/lib/types";
import GenerateWeeklyReviewButton from "@/components/generate-weekly-review-button";

export default async function ReviewsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: weeklyReviewsData } = await supabase
    .from("weekly_reviews")
    .select(
      "id, user_id, week_start_date, week_end_date, total_hours, problems_solved, skills_improved, missed_days, depth_score, consistency_score, variety_score, brutal_reflection, llm_feedback, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const weeklyReviews = (weeklyReviewsData ?? []) as WeeklyReviewRecord[];

  return (
    <>
      <div className="page-header animate-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>Weekly Reviews</h1>
          <p>Brutal, honest feedback powered by AI — forcing you to confront your weaknesses.</p>
        </div>
        <GenerateWeeklyReviewButton />
      </div>

      {/* Philosophy */}
      <div className="glass-card animate-in animate-delay-1" style={{ marginBottom: 24 }}>
        <div className="glass-card-body" style={{ textAlign: "center", padding: "24px 32px" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, background: "linear-gradient(135deg, #10b981, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                1.01<sup style={{ fontSize: "0.875rem" }}>365</sup> = 37.8×
              </div>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: 4 }}>Growth compounds</div>
            </div>
            <div style={{ width: 1, background: "var(--glass-border)", alignSelf: "stretch" }} />
            <div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, background: "linear-gradient(135deg, #ef4444, #f87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                0.99<sup style={{ fontSize: "0.875rem" }}>365</sup> = 0.03×
              </div>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: 4 }}>Decay compounds too</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {weeklyReviews.length === 0 ? (
        <div className="glass-card animate-in animate-delay-2">
          <div className="glass-card-body">
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-text">No weekly reviews generated yet. Click &quot;Generate Weekly Review&quot; to get your first brutal feedback.</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-in animate-delay-2">
          {weeklyReviews.map((review, idx) => (
            <div key={review.id} className="glass-card">
              <div className="glass-card-body">
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      Week of {new Date(review.week_start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {new Date(review.week_end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                      Generated {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  {idx === 0 && <span className="badge badge-purple">Latest</span>}
                </div>

                {/* Scores Grid */}
                <div className="grid-cols-3" style={{ marginBottom: 16, gap: 10 }}>
                  <div style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--info-muted)", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#60a5fa" }}>{review.depth_score ?? 0}%</div>
                    <div style={{ fontSize: "0.625rem", color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.5px" }}>Depth</div>
                    <div className="metric-gauge" style={{ marginTop: 8 }}>
                      <div className="metric-gauge-fill" style={{ width: `${review.depth_score ?? 0}%`, background: "#3b82f6" }} />
                    </div>
                  </div>
                  <div style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--success-muted)", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#34d399" }}>{review.consistency_score ?? 0}%</div>
                    <div style={{ fontSize: "0.625rem", color: "#34d399", textTransform: "uppercase", letterSpacing: "0.5px" }}>Consistency</div>
                    <div className="metric-gauge" style={{ marginTop: 8 }}>
                      <div className="metric-gauge-fill" style={{ width: `${review.consistency_score ?? 0}%`, background: "#10b981" }} />
                    </div>
                  </div>
                  <div style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--purple-muted)", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#c084fc" }}>{review.variety_score ?? 0}%</div>
                    <div style={{ fontSize: "0.625rem", color: "#c084fc", textTransform: "uppercase", letterSpacing: "0.5px" }}>Variety</div>
                    <div className="metric-gauge" style={{ marginTop: 8 }}>
                      <div className="metric-gauge-fill" style={{ width: `${review.variety_score ?? 0}%`, background: "#a855f7" }} />
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Problems solved:</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>{review.problems_solved ?? 0}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Hours spent:</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>{review.total_hours ?? 0}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Missed days:</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#f87171" }}>{review.missed_days ?? 0}</span>
                  </div>
                </div>

                {/* Brutal Feedback */}
                {review.llm_feedback && (
                  <div className="brutal-card">
                    <div className="brutal-card-title">⚡ Brutal Feedback</div>
                    <p className="brutal-card-text">{review.llm_feedback}</p>
                  </div>
                )}

                {/* Skills Improved */}
                {review.skills_improved && review.skills_improved.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Skills Improved</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {review.skills_improved.map((skill) => (
                        <span key={skill} className="tag tag-green">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  requestMyCheckinLink,
} from "@/app/actions";
import {
  ProfileRecord,
  SkillRecord,
  ReflectionRecord,
  ProjectRecord,
  WeeklyReviewRecord,
} from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [
    { data: skillsData },
    { data: reflectionsData },
    { data: profileData },
    { data: projectsData },
    { data: weeklyReviewsData },
  ] = await Promise.all([
    supabase
      .from("skills")
      .select("id, user_id, name, status, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("daily_reflections")
      .select(
        "id, user_id, learned_today, leetcode_question, blockers, wins, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select(
        "user_id, email, full_name, github_username, github_analysis, github_synced_at, leetcode_username, leetcode_analysis, skill_gap_analysis, skill_gap_synced_at, current_streak, longest_streak, streak_last_updated, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("projects")
      .select(
        "id, user_id, title, description, status, progress_percent, current_focus, created_at, updated_at, started_at, completed_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("weekly_reviews")
      .select(
        "id, user_id, week_start_date, week_end_date, total_hours, problems_solved, skills_improved, missed_days, depth_score, consistency_score, variety_score, brutal_reflection, llm_feedback, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const skills = (skillsData ?? []) as SkillRecord[];
  const reflections = (reflectionsData ?? []) as ReflectionRecord[];
  const profile = profileData as ProfileRecord | null;
  const projects = (projectsData ?? []) as ProjectRecord[];
  const weeklyReviews = (weeklyReviewsData ?? []) as WeeklyReviewRecord[];
  const lastWeeklyReview = weeklyReviews[0] || null;

  const completedSkills = skills.filter((s) => s.status === "completed").length;
  const learningSkills = skills.filter((s) => s.status === "learning").length;
  const activeProjects = projects.filter((p) => p.status === "active");
  const futureProjects = projects.filter((p) => p.status === "future");

  return (
    <>
      {/* Page Header */}
      <div className="page-header animate-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
          </h1>
          <p>Here&apos;s your growth snapshot for today.</p>
        </div>
        <form action={requestMyCheckinLink}>
          <button type="submit" className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Email check-in
          </button>
        </form>
      </div>

      {/* Streak + Weekly Scores */}
      <div className="grid-cols-4 animate-in animate-delay-1" style={{ marginBottom: 20 }}>
        {/* Streak */}
        <div className="glass-card stat-card accent-fire">
          <div className="glass-card-body">
            <div className="stat-icon">🔥</div>
            <div className="stat-value streak-fire">
              {profile?.current_streak ?? 0}
            </div>
            <div className="stat-label">Day Streak</div>
            <div className="stat-sub">
              Longest: {profile?.longest_streak ?? 0} days
            </div>
          </div>
        </div>

        {/* Depth */}
        <div className="glass-card stat-card accent-blue">
          <div className="glass-card-body">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">
              {lastWeeklyReview?.depth_score ?? "—"}
              {lastWeeklyReview?.depth_score != null && <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>%</span>}
            </div>
            <div className="stat-label">Depth Score</div>
            <div className="stat-sub">Hard vs Easy ratio</div>
            {lastWeeklyReview?.depth_score != null && (
              <div className="metric-gauge">
                <div
                  className="metric-gauge-fill"
                  style={{
                    width: `${lastWeeklyReview.depth_score}%`,
                    background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Consistency */}
        <div className="glass-card stat-card accent-green">
          <div className="glass-card-body">
            <div className="stat-icon">📊</div>
            <div className="stat-value">
              {lastWeeklyReview?.consistency_score ?? "—"}
              {lastWeeklyReview?.consistency_score != null && <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>%</span>}
            </div>
            <div className="stat-label">Consistency</div>
            <div className="stat-sub">Daily check-ins</div>
            {lastWeeklyReview?.consistency_score != null && (
              <div className="metric-gauge">
                <div
                  className="metric-gauge-fill"
                  style={{
                    width: `${lastWeeklyReview.consistency_score}%`,
                    background: "linear-gradient(90deg, #10b981, #34d399)",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Variety */}
        <div className="glass-card stat-card accent-purple">
          <div className="glass-card-body">
            <div className="stat-icon">🎨</div>
            <div className="stat-value">
              {lastWeeklyReview?.variety_score ?? "—"}
              {lastWeeklyReview?.variety_score != null && <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>%</span>}
            </div>
            <div className="stat-label">Variety</div>
            <div className="stat-sub">Topic diversity</div>
            {lastWeeklyReview?.variety_score != null && (
              <div className="metric-gauge">
                <div
                  className="metric-gauge-fill"
                  style={{
                    width: `${lastWeeklyReview.variety_score}%`,
                    background: "linear-gradient(90deg, #a855f7, #c084fc)",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid-cols-3 animate-in animate-delay-2" style={{ marginBottom: 20 }}>
        <div className="glass-card">
          <div className="glass-card-body" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "var(--radius-md)", background: "var(--info-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>⭐</div>
            <div>
              <div style={{ fontSize: "1.375rem", fontWeight: 700 }}>{skills.length}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Skills</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <span className="badge badge-success">{completedSkills} done</span>
              <span className="badge badge-info">{learningSkills} learning</span>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="glass-card-body" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "var(--radius-md)", background: "var(--purple-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>📁</div>
            <div>
              <div style={{ fontSize: "1.375rem", fontWeight: 700 }}>{activeProjects.length}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Projects</div>
            </div>
            <span className="badge badge-muted" style={{ marginLeft: "auto" }}>{futureProjects.length} queued</span>
          </div>
        </div>

        <div className="glass-card">
          <div className="glass-card-body" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "var(--radius-md)", background: "var(--success-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>📝</div>
            <div>
              <div style={{ fontSize: "1.375rem", fontWeight: 700 }}>{reflections.length}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent Check-ins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-col: Brutal Review + Recent Check-ins */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }} className="animate-in animate-delay-3">
        {/* Brutal Review */}
        <div className="glass-card">
          <div className="glass-card-body">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 className="section-title">Weekly Brutal Review</h2>
              <Link href="/dashboard/reviews" className="btn btn-secondary btn-sm">
                View all
              </Link>
            </div>
            {lastWeeklyReview?.llm_feedback ? (
              <div className="brutal-card">
                <div className="brutal-card-title">⚡ LLM Feedback</div>
                <p className="brutal-card-text">
                  {lastWeeklyReview.llm_feedback.length > 400
                    ? lastWeeklyReview.llm_feedback.slice(0, 400) + "..."
                    : lastWeeklyReview.llm_feedback}
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Problems:</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>{lastWeeklyReview.problems_solved ?? 0}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Hours:</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>{lastWeeklyReview.total_hours ?? 0}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Missed:</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#f87171" }}>{lastWeeklyReview.missed_days ?? 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p className="empty-state-text">No weekly review yet. Generate one from the Reviews page.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="glass-card">
          <div className="glass-card-body">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 className="section-title">Recent Check-ins</h2>
              <Link href="/dashboard/checkins" className="btn btn-secondary btn-sm">
                View all
              </Link>
            </div>
            {reflections.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <p className="empty-state-text">No check-ins submitted yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {reflections.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="list-item">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                        {new Date(entry.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {entry.leetcode_question && (
                        <span className="tag tag-purple" style={{ fontSize: "0.625rem" }}>
                          LC: {entry.leetcode_question.length > 20 ? entry.leetcode_question.slice(0, 20) + "…" : entry.leetcode_question}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
                      {entry.learned_today.length > 120
                        ? entry.learned_today.slice(0, 120) + "..."
                        : entry.learned_today}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Projects Quick View */}
      {activeProjects.length > 0 && (
        <div className="glass-card animate-in animate-delay-4">
          <div className="glass-card-body">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 className="section-title">Active Projects</h2>
              <Link href="/dashboard/projects" className="btn btn-secondary btn-sm">
                Manage
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activeProjects.slice(0, 3).map((project) => (
                <div key={project.id} className="list-item" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{project.title}</span>
                      <span className="badge badge-info">{project.progress_percent}%</span>
                    </div>
                    {project.current_focus && (
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Focus: {project.current_focus}</p>
                    )}
                  </div>
                  <div style={{ width: 120 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${project.progress_percent}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

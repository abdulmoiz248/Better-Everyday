import { redirect } from "next/navigation";
import { syncGithubProfile, refreshGithubProfile } from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ProfileRecord,
  GitHubAnalysisRecord,
  LeetCodeAnalysisRecord,
  SkillGapAnalysisRecord,
} from "@/lib/types";

function areaSignalBadge(signal: string) {
  if (signal === "gap") return "tag-red";
  if (signal === "warning") return "tag-amber";
  return "tag-green";
}

function insightSeverityBadge(severity: string) {
  if (severity === "high") return "badge-danger";
  if (severity === "medium") return "badge-warning";
  return "badge-muted";
}

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select(
      "user_id, email, full_name, github_username, github_analysis, github_synced_at, leetcode_username, leetcode_analysis, skill_gap_analysis, skill_gap_synced_at, current_streak, longest_streak, streak_last_updated, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = profileData as ProfileRecord | null;
  const githubAnalysis = profile?.github_analysis as GitHubAnalysisRecord | null;
  const leetcodeAnalysis = profile?.leetcode_analysis as LeetCodeAnalysisRecord | null;
  const skillGapAnalysis = profile?.skill_gap_analysis as SkillGapAnalysisRecord | null;

  return (
    <>
      <div className="page-header animate-in">
        <h1>Analytics</h1>
        <p>Connect your profiles for deep insights into your coding strengths and gaps.</p>
      </div>

      {/* Connect Profiles */}
      <div className="glass-card animate-in animate-delay-1" style={{ marginBottom: 24 }}>
        <div className="glass-card-body">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="section-title">Connect Profiles</h2>
              <p className="section-subtitle">Link your GitHub and LeetCode accounts for analysis.</p>
            </div>
            <form action={refreshGithubProfile}>
              <button type="submit" className="btn btn-secondary btn-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Refresh
              </button>
            </form>
          </div>

          <form action={syncGithubProfile} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="form-group" style={{ flex: "1 1 220px" }}>
              <label className="form-label" htmlFor="github-username">GitHub Username</label>
              <input
                type="text"
                id="github-username"
                name="githubUsername"
                defaultValue={profile?.github_username ?? ""}
                placeholder="your-github-username"
                className="input"
              />
            </div>
            <div className="form-group" style={{ flex: "1 1 220px" }}>
              <label className="form-label" htmlFor="leetcode-username">LeetCode Username</label>
              <input
                type="text"
                id="leetcode-username"
                name="leetcodeUsername"
                defaultValue={profile?.leetcode_username ?? ""}
                placeholder="your-leetcode-username"
                className="input"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Analyze
            </button>
          </form>

          {profile?.skill_gap_synced_at && (
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: 12 }}>
              Last synced: {new Date(profile.skill_gap_synced_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* GitHub + LeetCode Analysis */}
      {(githubAnalysis || leetcodeAnalysis) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }} className="animate-in animate-delay-2">
          {/* GitHub */}
          {githubAnalysis && (
            <div className="glass-card">
              <div className="glass-card-body">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--hover-overlay-strong)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--text-secondary)" }}>
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <h2 className="section-title">GitHub Analysis</h2>
                </div>

                <div className="grid-cols-3" style={{ marginBottom: 16, gap: 10 }}>
                  <div style={{ padding: 10, borderRadius: "var(--radius-sm)", background: "var(--stat-bg)" }}>
                    <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Repos</div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 700 }}>{githubAnalysis.repoCount}</div>
                  </div>
                  <div style={{ padding: 10, borderRadius: "var(--radius-sm)", background: "var(--stat-bg)" }}>
                    <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Stars</div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 700 }}>⭐ {githubAnalysis.starCount}</div>
                  </div>
                  <div style={{ padding: 10, borderRadius: "var(--radius-sm)", background: "var(--stat-bg)" }}>
                    <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>User</div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>@{githubAnalysis.username}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Top Languages</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {githubAnalysis.topLanguages.length === 0 ? (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No languages detected.</span>
                    ) : (
                      githubAnalysis.topLanguages.map((lang) => (
                        <span key={lang.name} className="tag tag-blue">
                          {lang.name} · {lang.count}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Inferred Skills</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {githubAnalysis.inferredSkills.length === 0 ? (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No skills inferred yet.</span>
                    ) : (
                      githubAnalysis.inferredSkills.map((skill) => (
                        <span key={skill} className="tag tag-green">
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Sample Repos</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {githubAnalysis.sampleRepos.map((repo) => (
                      <a
                        key={repo.html_url}
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="list-item text-link"
                        style={{ display: "block", textDecoration: "none" }}
                      >
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>{repo.name}</span>
                        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: 2 }}>
                          {repo.language ?? "Unknown"}{repo.topics.length ? ` · ${repo.topics.join(", ")}` : ""}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LeetCode */}
          <div className="glass-card">
            <div className="glass-card-body">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--hover-overlay-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                  🧩
                </div>
                <h2 className="section-title">LeetCode Analysis</h2>
              </div>

              {!leetcodeAnalysis ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🧩</div>
                  <p className="empty-state-text">Add your LeetCode username above to see difficulty and topic analysis.</p>
                </div>
              ) : (
                <>
                  {/* Difficulty Distribution */}
                  <div className="grid-cols-4" style={{ marginBottom: 16, gap: 8 }}>
                    <div style={{ padding: 10, borderRadius: "var(--radius-sm)", background: "var(--stat-bg)", textAlign: "center" }}>
                      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>{leetcodeAnalysis.solvedCount.total}</div>
                      <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Total</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: "var(--radius-sm)", background: "var(--success-muted)", textAlign: "center" }}>
                      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#34d399" }}>{leetcodeAnalysis.solvedCount.easy}</div>
                      <div style={{ fontSize: "0.625rem", color: "#34d399", textTransform: "uppercase" }}>Easy</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: "var(--radius-sm)", background: "var(--warning-muted)", textAlign: "center" }}>
                      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fbbf24" }}>{leetcodeAnalysis.solvedCount.medium}</div>
                      <div style={{ fontSize: "0.625rem", color: "#fbbf24", textTransform: "uppercase" }}>Medium</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: "var(--radius-sm)", background: "var(--danger-muted)", textAlign: "center" }}>
                      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f87171" }}>{leetcodeAnalysis.solvedCount.hard}</div>
                      <div style={{ fontSize: "0.625rem", color: "#f87171", textTransform: "uppercase" }}>Hard</div>
                    </div>
                  </div>

                  {/* Topic Tags */}
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Top Topics</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {leetcodeAnalysis.topTags.length === 0 ? (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No topic data yet.</span>
                      ) : (
                        leetcodeAnalysis.topTags.slice(0, 10).map((tag) => (
                          <span key={tag.name} className="tag tag-purple">
                            {tag.name} · {tag.solved}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Skill Gap Detection */}
      {skillGapAnalysis && (
        <div className="glass-card animate-in animate-delay-3" style={{ marginBottom: 24 }}>
          <div className="glass-card-body">
            <h2 className="section-title" style={{ marginBottom: 4 }}>Skill Gap Detection</h2>
            <p className="section-subtitle" style={{ marginBottom: 16 }}>Automatically detected weaknesses from your activity patterns.</p>

            {skillGapAnalysis.primaryWeakness && (
              <div style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--danger-muted)", marginBottom: 16 }}>
                <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                  ⚠️ Primary Weakness
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{skillGapAnalysis.primaryWeakness}</p>
              </div>
            )}

            {/* Area Coverage */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Area Coverage</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skillGapAnalysis.coverage.trackedAreas.map((item) => (
                  <span key={item.area} className={`tag ${areaSignalBadge(item.signal)}`}>
                    {item.area} · {item.daysSinceTouched >= 999 ? "not touched" : `${item.daysSinceTouched}d`}
                  </span>
                ))}
              </div>
            </div>

            {/* Insights */}
            {skillGapAnalysis.insights.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Insights</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {skillGapAnalysis.insights.map((insight) => (
                    <div key={insight.id} className="insight-card">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>{insight.title}</span>
                        <span className={`badge ${insightSeverityBadge(insight.severity)}`}>{insight.severity}</span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{insight.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {skillGapAnalysis.recommendations.length > 0 && (
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Suggested Next Steps</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 4 }}>
                  {skillGapAnalysis.recommendations.map((rec) => (
                    <div key={rec} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "var(--accent-from)", fontSize: "0.75rem", marginTop: 2 }}>→</span>
                      <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", lineHeight: 1.5 }}>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No data state */}
      {!githubAnalysis && !leetcodeAnalysis && !skillGapAnalysis && (
        <div className="glass-card animate-in animate-delay-2">
          <div className="glass-card-body">
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p className="empty-state-text">Connect your GitHub and LeetCode profiles above to unlock deep analytics and skill-gap detection.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

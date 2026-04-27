import { redirect } from "next/navigation";
import {
  addFutureProject,
  addSkill,
  logProjectProgress,
  requestMyCheckinLink,
  refreshGithubProfile,
  startProject,
  syncGithubProfile,
  updateSkillStatus,
} from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import GenerateWeeklyReviewButton from "@/components/generate-weekly-review-button";
import {
  GitHubAnalysisRecord,
  LeetCodeAnalysisRecord,
  ProjectRecord,
  ProjectUpdateRecord,
  ProfileRecord,
  ReflectionRecord,
  SkillGapAnalysisRecord,
  WeeklyReviewRecord,
  SkillRecord,
} from "@/lib/types";

function statusBadge(status: string) {
  if (status === "completed") {
    return "bg-green-100 text-green-800";
  }

  if (status === "learning") {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-amber-100 text-amber-800";
}

function projectStatusBadge(status: string) {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "active") {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-zinc-100 text-zinc-700";
}

function insightSeverityBadge(severity: string) {
  if (severity === "high") {
    return "bg-rose-100 text-rose-700";
  }

  if (severity === "medium") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

function areaSignalBadge(signal: string) {
  if (signal === "gap") {
    return "bg-rose-100 text-rose-700";
  }

  if (signal === "warning") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-emerald-100 text-emerald-700";
}

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
    { data: projectUpdatesData },
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
        .limit(10),
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
        .from("project_updates")
        .select(
          "id, project_id, user_id, update_note, learned, stats, progress_percent, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
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
  const githubAnalysis = profile?.github_analysis as GitHubAnalysisRecord | null;
  const leetcodeAnalysis = profile?.leetcode_analysis as LeetCodeAnalysisRecord | null;
  const skillGapAnalysis = profile?.skill_gap_analysis as SkillGapAnalysisRecord | null;
  const weeklyReviews = (weeklyReviewsData ?? []) as WeeklyReviewRecord[];
  const lastWeeklyReview = weeklyReviews[0] || null;
  const projects = (projectsData ?? []) as ProjectRecord[];
  const projectUpdates = (projectUpdatesData ?? []) as ProjectUpdateRecord[];
  const completedSkills = skills.filter((skill) => skill.status === "completed").length;
  const pendingSkills = skills.filter((skill) => skill.status !== "completed").length;
  const totalReflections = reflections.length;
  const futureProjects = projects.filter((project) => project.status === "future");
  const activeProjects = projects.filter((project) => project.status === "active");
  const projectTitleById = new Map(projects.map((project) => [project.id, project.title]));

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">Signed in as {user.email}</p>
            <h1 className="text-2xl font-semibold">BetterEveryday Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <form action={requestMyCheckinLink}>
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Email me today&apos;s check-in
              </button>
            </form>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        {/* Streak & Weekly Analytics */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Your Progress</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-rose-50 p-4">
              <p className="text-xs text-rose-600">Current Streak</p>
              <p className="mt-1 text-3xl font-bold text-rose-700">🔥 {profile?.current_streak ?? 0}</p>
              <p className="mt-1 text-xs text-rose-600">Longest: {profile?.longest_streak ?? 0}</p>
            </div>
            {lastWeeklyReview ? (
              <>
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs text-blue-600">Depth Score</p>
                  <p className="mt-1 text-3xl font-bold text-blue-700">{lastWeeklyReview.depth_score ?? 0}%</p>
                  <p className="mt-1 text-xs text-blue-600">Easy vs Hard</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-600">Consistency</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-700">{lastWeeklyReview.consistency_score ?? 0}%</p>
                  <p className="mt-1 text-xs text-emerald-600">Daily Check-ins</p>
                </div>
                <div className="rounded-xl bg-purple-50 p-4">
                  <p className="text-xs text-purple-600">Variety</p>
                  <p className="mt-1 text-3xl font-bold text-purple-700">{lastWeeklyReview.variety_score ?? 0}%</p>
                  <p className="mt-1 text-xs text-purple-600">Topic Diversity</p>
                </div>
              </>
            ) : (
              <div className="col-span-3 rounded-xl bg-zinc-100 p-4">
                <p className="text-sm text-zinc-600">Weekly review coming...</p>
              </div>
            )}
          </div>

          {lastWeeklyReview && (
            <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-zinc-500">Problems Solved</p>
                  <p className="text-lg font-semibold">{lastWeeklyReview.problems_solved ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Hours Spent</p>
                  <p className="text-lg font-semibold">{lastWeeklyReview.total_hours ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Missed Days</p>
                  <p className="text-lg font-semibold text-rose-600">{lastWeeklyReview.missed_days ?? 0}</p>
                </div>
              </div>

              {lastWeeklyReview.llm_feedback && (
                <div className="mt-3 rounded-lg bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-900">Weekly Brutal Review</p>
                  <p className="mt-2 text-sm text-amber-900">{lastWeeklyReview.llm_feedback}</p>
                          <div className="mt-6 border-t border-zinc-200 pt-6">
                            <p className="text-sm text-zinc-600 mb-3">Generate or refresh your weekly brutal review:</p>
                            <GenerateWeeklyReviewButton />
                          </div>
                </div>
              )}

              
            </div>
          )}
        </section>


        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Total skills</p>
            <p className="text-3xl font-semibold">{skills.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Completed skills</p>
            <p className="text-3xl font-semibold">{completedSkills}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Pending / learning</p>
            <p className="text-3xl font-semibold">{pendingSkills}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Active projects</p>
            <p className="text-3xl font-semibold">{activeProjects.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Future projects</p>
            <p className="text-3xl font-semibold">{futureProjects.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Project updates logged</p>
            <p className="text-3xl font-semibold">{projectUpdates.length}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Add a skill</h2>
            <form action={addSkill} className="mt-4 space-y-3">
              <input
                type="text"
                name="name"
                placeholder="e.g. Dynamic Programming"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                required
              />
              <select
                name="status"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                defaultValue="pending"
              >
                <option value="pending">Pending</option>
                <option value="learning">Learning</option>
                <option value="completed">Completed</option>
              </select>
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Add skill
              </button>
            </form>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">GitHub analysis</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Connect your GitHub username to infer languages and skills from public repos.
            </p>

            <form action={syncGithubProfile} className="mt-4 space-y-3">
              <input
                type="text"
                name="githubUsername"
                defaultValue={profile?.github_username ?? ""}
                placeholder="github-username"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
              <input
                type="text"
                name="leetcodeUsername"
                defaultValue={profile?.leetcode_username ?? ""}
                placeholder="leetcode-username"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Analyze profile
                </button>
              </div>
            </form>

            <form action={refreshGithubProfile} className="mt-2">
              <button
                type="submit"
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm"
              >
                Refresh saved profile
              </button>
            </form>

            {githubAnalysis || leetcodeAnalysis || skillGapAnalysis ? (
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Repos analyzed</p>
                    <p className="text-xl font-semibold">{githubAnalysis?.repoCount ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Stars</p>
                    <p className="text-xl font-semibold">{githubAnalysis?.starCount ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Synced</p>
                    <p className="text-sm font-medium">
                      {profile?.skill_gap_synced_at
                        ? new Date(profile.skill_gap_synced_at).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>

                {githubAnalysis ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-zinc-700">Top languages</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {githubAnalysis.topLanguages.length === 0 ? (
                          <span className="text-sm text-zinc-500">No languages detected yet.</span>
                        ) : (
                          githubAnalysis.topLanguages.map((item) => (
                            <span
                              key={item.name}
                              className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
                            >
                              {item.name} · {item.count}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-zinc-700">Inferred skills</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {githubAnalysis.inferredSkills.length === 0 ? (
                          <span className="text-sm text-zinc-500">No inferred skills yet.</span>
                        ) : (
                          githubAnalysis.inferredSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700"
                            >
                              {skill}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-zinc-700">Sample repos</p>
                      <ul className="mt-2 space-y-2">
                        {githubAnalysis.sampleRepos.map((repo) => (
                          <li key={repo.html_url} className="rounded-xl border border-zinc-200 p-3">
                            <a href={repo.html_url} target="_blank" rel="noreferrer" className="font-medium text-zinc-900 hover:underline">
                              {repo.name}
                            </a>
                            <p className="text-sm text-zinc-600">
                              {repo.language ?? "Unknown language"}
                              {repo.topics.length ? ` · ${repo.topics.join(", ")}` : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : null}

                <div>
                  <p className="text-sm font-medium text-zinc-700">LeetCode</p>
                  {!leetcodeAnalysis ? (
                    <p className="mt-2 text-sm text-zinc-500">
                      Add your LeetCode username to include problem difficulty and topic signals.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-zinc-700">
                        Solved: {leetcodeAnalysis.solvedCount.total} total · {leetcodeAnalysis.solvedCount.easy} easy · {leetcodeAnalysis.solvedCount.medium} medium · {leetcodeAnalysis.solvedCount.hard} hard
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {leetcodeAnalysis.topTags.length === 0 ? (
                          <span className="text-sm text-zinc-500">No topic data detected yet.</span>
                        ) : (
                          leetcodeAnalysis.topTags.slice(0, 8).map((tag) => (
                            <span
                              key={tag.name}
                              className="rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-700"
                            >
                              {tag.name} · {tag.solved}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-zinc-700">Skill gap detection</p>
                  {!skillGapAnalysis ? (
                    <p className="mt-2 text-sm text-zinc-500">Run profile analysis to detect your weak spots automatically.</p>
                  ) : (
                    <div className="mt-2 space-y-3">
                      <p className="text-sm text-zinc-700">
                        Primary weakness: {skillGapAnalysis.primaryWeakness ?? "No major gap detected"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {skillGapAnalysis.coverage.trackedAreas.map((item) => (
                          <span
                            key={item.area}
                            className={`rounded-full px-3 py-1 text-sm ${areaSignalBadge(item.signal)}`}
                          >
                            {item.area} · {item.daysSinceTouched >= 999 ? "not touched" : `${item.daysSinceTouched}d`}
                          </span>
                        ))}
                      </div>
                      <ul className="space-y-2">
                        {skillGapAnalysis.insights.length === 0 ? (
                          <li className="text-sm text-zinc-500">No urgent weakness detected yet.</li>
                        ) : (
                          skillGapAnalysis.insights.map((insight) => (
                            <li key={insight.id} className="rounded-xl border border-zinc-200 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-zinc-900">{insight.title}</p>
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${insightSeverityBadge(insight.severity)}`}
                                >
                                  {insight.severity}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-zinc-700">{insight.message}</p>
                            </li>
                          ))
                        )}
                      </ul>
                      <div>
                        <p className="text-sm font-medium text-zinc-700">Suggested next steps</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                          {skillGapAnalysis.recommendations.map((recommendation) => (
                            <li key={recommendation}>{recommendation}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                Save your GitHub (and optional LeetCode) username to generate language, difficulty, and skill-gap insights.
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Recent check-ins</h2>
            <p className="mt-1 text-sm text-zinc-500">Last 10 daily responses</p>
            <p className="mt-3 text-sm font-medium text-zinc-700">
              Entries tracked: {totalReflections}
            </p>
            <ul className="mt-4 space-y-3">
              {reflections.length === 0 ? (
                <li className="text-sm text-zinc-500">No check-ins submitted yet.</li>
              ) : (
                reflections.map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-zinc-200 p-3">
                    <p className="text-xs text-zinc-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm font-medium">{entry.learned_today}</p>
                    {entry.leetcode_question ? (
                      <p className="text-sm text-zinc-600">
                        LeetCode: {entry.leetcode_question}
                      </p>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Skill history</h2>
          <p className="mt-1 text-sm text-zinc-500">Your saved and pending skills</p>
          <ul className="mt-4 space-y-3">
            {skills.length === 0 ? (
              <li className="text-sm text-zinc-500">No skills added yet.</li>
            ) : (
              skills.map((skill) => (
                <li
                  key={skill.id}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{skill.name}</p>
                    <p className="text-xs text-zinc-500">
                      Added {new Date(skill.created_at).toLocaleDateString()}
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadge(skill.status)}`}
                    >
                      {skill.status}
                    </span>
                  </div>
                  <form action={updateSkillStatus} className="flex items-center gap-2">
                    <input type="hidden" name="skillId" value={skill.id} />
                    <select
                      name="status"
                      defaultValue={skill.status}
                      className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="learning">Learning</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-full border border-zinc-300 px-3 py-2 text-sm"
                    >
                      Save
                    </button>
                  </form>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Future projects</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Add projects you plan to build later.
            </p>
            <form action={addFutureProject} className="mt-4 space-y-3">
              <input
                type="text"
                name="title"
                placeholder="e.g. AI expense tracker"
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
              <textarea
                name="description"
                rows={3}
                placeholder="What will this project do?"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Add future project
              </button>
            </form>

            <ul className="mt-4 space-y-3">
              {futureProjects.length === 0 ? (
                <li className="text-sm text-zinc-500">No future projects added yet.</li>
              ) : (
                futureProjects.map((project) => (
                  <li key={project.id} className="rounded-xl border border-zinc-200 p-3">
                    <p className="font-medium">{project.title}</p>
                    {project.description ? (
                      <p className="mt-1 text-sm text-zinc-600">{project.description}</p>
                    ) : null}
                    <form action={startProject} className="mt-3">
                      <input type="hidden" name="projectId" value={project.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-zinc-300 px-3 py-2 text-sm"
                      >
                        Start this project
                      </button>
                    </form>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Current projects</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Update progress, stats, and what you learned today.
            </p>
            <div className="mt-4 space-y-4">
              {activeProjects.length === 0 ? (
                <p className="text-sm text-zinc-500">No active project yet. Start one from future projects.</p>
              ) : (
                activeProjects.map((project) => (
                  <div key={project.id} className="rounded-xl border border-zinc-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{project.title}</p>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${projectStatusBadge(project.status)}`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">
                      Progress: {project.progress_percent}%
                    </p>
                    {project.current_focus ? (
                      <p className="text-sm text-zinc-600">
                        Current focus: {project.current_focus}
                      </p>
                    ) : null}

                    <form action={logProjectProgress} className="mt-3 space-y-3">
                      <input type="hidden" name="projectId" value={project.id} />
                      <textarea
                        name="updateNote"
                        rows={3}
                        required
                        placeholder="What did you do today?"
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                      />
                      <textarea
                        name="learned"
                        rows={2}
                        placeholder="What new thing did you learn?"
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                      />
                      <textarea
                        name="stats"
                        rows={2}
                        placeholder="Stats: commits, tasks done, bugs fixed, hours spent..."
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                      />
                      <input
                        type="text"
                        name="currentFocus"
                        placeholder="Current focus"
                        defaultValue={project.current_focus ?? ""}
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="number"
                          name="progressPercent"
                          min={0}
                          max={100}
                          defaultValue={project.progress_percent}
                          className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                        />
                        <select
                          name="status"
                          defaultValue={project.status}
                          className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                        >
                          <option value="future">Future</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Save update
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Project history</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Complete timeline of what you did, your progress, stats, and learnings.
          </p>
          <ul className="mt-4 space-y-3">
            {projectUpdates.length === 0 ? (
              <li className="text-sm text-zinc-500">No project updates logged yet.</li>
            ) : (
              projectUpdates.map((update) => (
                <li key={update.id} className="rounded-xl border border-zinc-200 p-4">
                  <p className="text-xs text-zinc-500">
                    {new Date(update.created_at).toLocaleString()} · {projectTitleById.get(update.project_id) ?? "Unknown project"}
                  </p>
                  <p className="mt-1 text-sm font-medium">{update.update_note}</p>
                  {update.learned ? (
                    <p className="mt-1 text-sm text-zinc-700">Learned: {update.learned}</p>
                  ) : null}
                  {update.stats ? (
                    <p className="mt-1 text-sm text-zinc-700">Stats: {update.stats}</p>
                  ) : null}
                  {update.progress_percent !== null ? (
                    <p className="mt-1 text-sm text-zinc-600">
                      Progress snapshot: {update.progress_percent}%
                    </p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

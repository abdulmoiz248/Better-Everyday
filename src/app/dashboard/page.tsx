import { redirect } from "next/navigation";
import {
  addSkill,
  requestMyCheckinLink,
  refreshGithubProfile,
  syncGithubProfile,
  updateSkillStatus,
} from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  GitHubAnalysisRecord,
  ProfileRecord,
  ReflectionRecord,
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

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: skillsData }, { data: reflectionsData }, { data: profileData }] =
    await Promise.all([
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
          "user_id, email, full_name, github_username, github_analysis, github_synced_at, created_at, updated_at",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const skills = (skillsData ?? []) as SkillRecord[];
  const reflections = (reflectionsData ?? []) as ReflectionRecord[];
  const profile = profileData as ProfileRecord | null;
  const githubAnalysis = profile?.github_analysis as GitHubAnalysisRecord | null;
  const completedSkills = skills.filter((skill) => skill.status === "completed").length;
  const pendingSkills = skills.filter((skill) => skill.status !== "completed").length;
  const totalReflections = reflections.length;

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
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Analyze GitHub
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

            {githubAnalysis ? (
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Repos analyzed</p>
                    <p className="text-xl font-semibold">{githubAnalysis.repoCount}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Stars</p>
                    <p className="text-xl font-semibold">{githubAnalysis.starCount}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Synced</p>
                    <p className="text-sm font-medium">
                      {profile?.github_synced_at
                        ? new Date(profile.github_synced_at).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>

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
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                Save a GitHub username to generate language and skill insights.
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
      </div>
    </div>
  );
}

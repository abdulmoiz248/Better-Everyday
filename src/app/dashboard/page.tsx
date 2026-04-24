import { redirect } from "next/navigation";
import {
  addSkill,
  requestMyCheckinLink,
  updateSkillStatus,
} from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReflectionRecord, SkillRecord } from "@/lib/types";

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

  const [{ data: skillsData }, { data: reflectionsData }] = await Promise.all([
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
  ]);

  const skills = (skillsData ?? []) as SkillRecord[];
  const reflections = (reflectionsData ?? []) as ReflectionRecord[];
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

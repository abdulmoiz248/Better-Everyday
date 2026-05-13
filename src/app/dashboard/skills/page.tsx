import { redirect } from "next/navigation";
import { addSkill, updateSkillStatus } from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SkillRecord } from "@/lib/types";

function statusBadgeClass(status: string) {
  if (status === "completed") return "badge-success";
  if (status === "learning") return "badge-info";
  return "badge-warning";
}

export default async function SkillsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: skillsData } = await supabase
    .from("skills")
    .select("id, user_id, name, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const skills = (skillsData ?? []) as SkillRecord[];
  const completedSkills = skills.filter((s) => s.status === "completed");
  const learningSkills = skills.filter((s) => s.status === "learning");
  const pendingSkills = skills.filter((s) => s.status === "pending");

  return (
    <>
      <div className="page-header animate-in">
        <h1>Skills</h1>
        <p>Track your skills journey — what you&apos;re learning, what&apos;s pending, and what you&apos;ve mastered.</p>
      </div>

      {/* Stats Row */}
      <div className="grid-cols-3 animate-in animate-delay-1" style={{ marginBottom: 24 }}>
        <div className="glass-card stat-card accent-blue">
          <div className="glass-card-body">
            <div className="stat-icon">📚</div>
            <div className="stat-value">{skills.length}</div>
            <div className="stat-label">Total Skills</div>
          </div>
        </div>
        <div className="glass-card stat-card accent-green">
          <div className="glass-card-body">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{completedSkills.length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="glass-card stat-card accent-purple">
          <div className="glass-card-body">
            <div className="stat-icon">🚀</div>
            <div className="stat-value">{learningSkills.length}</div>
            <div className="stat-label">Learning</div>
          </div>
        </div>
      </div>

      {/* Add Skill Form */}
      <div className="glass-card animate-in animate-delay-2" style={{ marginBottom: 24 }}>
        <div className="glass-card-body">
          <h2 className="section-title" style={{ marginBottom: 16 }}>Add a new skill</h2>
          <form action={addSkill} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="form-group" style={{ flex: "1 1 260px" }}>
              <label className="form-label" htmlFor="skill-name">Skill name</label>
              <input
                type="text"
                id="skill-name"
                name="name"
                placeholder="e.g. Dynamic Programming"
                className="input"
                required
              />
            </div>
            <div className="form-group" style={{ flex: "0 0 160px" }}>
              <label className="form-label" htmlFor="skill-status">Status</label>
              <select
                id="skill-status"
                name="status"
                className="select"
                defaultValue="pending"
              >
                <option value="pending">Pending</option>
                <option value="learning">Learning</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Add skill
            </button>
          </form>
        </div>
      </div>

      {/* Skill List */}
      <div className="glass-card animate-in animate-delay-3">
        <div className="glass-card-body">
          <h2 className="section-title" style={{ marginBottom: 4 }}>Your skills</h2>
          <p className="section-subtitle" style={{ marginBottom: 20 }}>Manage status and track progress</p>

          {skills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⭐</div>
              <p className="empty-state-text">No skills added yet. Add your first skill above!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Learning Skills */}
              {learningSkills.length > 0 && (
                <>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", padding: "8px 0 4px", fontWeight: 600 }}>
                    Currently Learning ({learningSkills.length})
                  </div>
                  {learningSkills.map((skill) => (
                    <SkillItem key={skill.id} skill={skill} />
                  ))}
                </>
              )}

              {/* Pending Skills */}
              {pendingSkills.length > 0 && (
                <>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", padding: "12px 0 4px", fontWeight: 600 }}>
                    Pending ({pendingSkills.length})
                  </div>
                  {pendingSkills.map((skill) => (
                    <SkillItem key={skill.id} skill={skill} />
                  ))}
                </>
              )}

              {/* Completed Skills */}
              {completedSkills.length > 0 && (
                <>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", padding: "12px 0 4px", fontWeight: 600 }}>
                    Completed ({completedSkills.length})
                  </div>
                  {completedSkills.map((skill) => (
                    <SkillItem key={skill.id} skill={skill} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SkillItem({ skill }: { skill: SkillRecord }) {
  return (
    <div className="list-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{skill.name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className={`badge ${statusBadgeClass(skill.status)}`}>{skill.status}</span>
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            Added {new Date(skill.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>
      <form action={updateSkillStatus} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="hidden" name="skillId" value={skill.id} />
        <select
          name="status"
          defaultValue={skill.status}
          className="select"
          style={{ width: 130, padding: "6px 30px 6px 10px", fontSize: "0.75rem" }}
        >
          <option value="pending">Pending</option>
          <option value="learning">Learning</option>
          <option value="completed">Completed</option>
        </select>
        <button type="submit" className="btn btn-secondary btn-sm">
          Update
        </button>
      </form>
    </div>
  );
}

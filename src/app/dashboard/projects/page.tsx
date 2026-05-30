import { redirect } from "next/navigation";
import {
  addFutureProject,
  logProjectProgress,
  startProject,
} from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ProjectRecord,
  ProjectUpdateRecord,
} from "@/lib/types";

function projectStatusBadge(status: string) {
  if (status === "completed") return "badge-success";
  if (status === "active") return "badge-info";
  return "badge-muted";
}

export default async function ProjectsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: projectsData }, { data: updatesData }] = await Promise.all([
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
  ]);

  const projects = (projectsData ?? []) as ProjectRecord[];
  const projectUpdates = (updatesData ?? []) as ProjectUpdateRecord[];
  const futureProjects = projects.filter((p) => p.status === "future");
  const activeProjects = projects.filter((p) => p.status === "active");
  const completedProjects = projects.filter((p) => p.status === "completed");
  const projectTitleById = new Map(projects.map((p) => [p.id, p.title]));

  return (
    <>
      <div className="page-header animate-in">
        <h1>Projects</h1>
        <p>Manage your project pipeline — from ideas to completion.</p>
      </div>

      {/* Stats */}
      <div className="grid-cols-3 animate-in animate-delay-1" style={{ marginBottom: 24 }}>
        <div className="glass-card stat-card accent-blue">
          <div className="glass-card-body">
            <div className="stat-icon">🚀</div>
            <div className="stat-value">{activeProjects.length}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="glass-card stat-card accent-amber">
          <div className="glass-card-body">
            <div className="stat-icon">💡</div>
            <div className="stat-value">{futureProjects.length}</div>
            <div className="stat-label">Queued</div>
          </div>
        </div>
        <div className="glass-card stat-card accent-green">
          <div className="glass-card-body">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{completedProjects.length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Two-col: Active Projects + Add Future */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }} className="animate-in animate-delay-2">
        {/* Active Projects */}
        <div className="glass-card">
          <div className="glass-card-body">
            <h2 className="section-title" style={{ marginBottom: 4 }}>Active Projects</h2>
            <p className="section-subtitle" style={{ marginBottom: 16 }}>Update progress, stats, and what you learned.</p>
            {activeProjects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏗️</div>
                <p className="empty-state-text">No active projects. Start one from your queue!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {activeProjects.map((project) => (
                  <div key={project.id} style={{ padding: 16, borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)", background: "var(--list-item-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: "0.9375rem", fontWeight: 600 }}>{project.title}</span>
                      <span className="badge badge-info">{project.progress_percent}%</span>
                    </div>
                    <div className="progress-bar" style={{ marginBottom: 10 }}>
                      <div className="progress-fill" style={{ width: `${project.progress_percent}%` }} />
                    </div>
                    {project.current_focus && (
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 12 }}>
                        🎯 Focus: {project.current_focus}
                      </p>
                    )}
                    <form action={logProjectProgress} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <textarea
                        name="updateNote"
                        rows={2}
                        required
                        placeholder="What did you do today?"
                        className="textarea"
                      />
                      <textarea
                        name="learned"
                        rows={2}
                        placeholder="What new thing did you learn?"
                        className="textarea"
                      />
                      <textarea
                        name="stats"
                        rows={1}
                        placeholder="Stats: commits, tasks done, bugs fixed..."
                        className="textarea"
                      />
                      <input
                        type="text"
                        name="currentFocus"
                        placeholder="Current focus"
                        defaultValue={project.current_focus ?? ""}
                        className="input"
                      />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <input
                          type="number"
                          name="progressPercent"
                          min={0}
                          max={100}
                          defaultValue={project.progress_percent}
                          className="input"
                        />
                        <select
                          name="status"
                          defaultValue={project.status}
                          className="select"
                        >
                          <option value="future">Future</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }}>
                        Save update
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Future Projects */}
        <div className="glass-card">
          <div className="glass-card-body">
            <h2 className="section-title" style={{ marginBottom: 4 }}>Future Projects</h2>
            <p className="section-subtitle" style={{ marginBottom: 16 }}>Ideas you plan to build later.</p>

            <form action={addFutureProject} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <input
                type="text"
                name="title"
                placeholder="e.g. AI expense tracker"
                required
                className="input"
              />
              <textarea
                name="description"
                rows={2}
                placeholder="What will this project do?"
                className="textarea"
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }}>
                Add to queue
              </button>
            </form>

            <div className="divider" />

            {futureProjects.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px 0" }}>
                <div className="empty-state-icon">💡</div>
                <p className="empty-state-text">No future projects queued yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {futureProjects.map((project) => (
                  <div key={project.id} className="list-item">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{project.title}</span>
                      <form action={startProject}>
                        <input type="hidden" name="projectId" value={project.id} />
                        <button type="submit" className="btn btn-secondary btn-sm">
                          Start
                        </button>
                      </form>
                    </div>
                    {project.description && (
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{project.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project History Timeline */}
      <div className="glass-card animate-in animate-delay-3">
        <div className="glass-card-body">
          <h2 className="section-title" style={{ marginBottom: 4 }}>Project History</h2>
          <p className="section-subtitle" style={{ marginBottom: 20 }}>Complete timeline of updates, progress, and learnings.</p>

          {projectUpdates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📜</div>
              <p className="empty-state-text">No project updates logged yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {projectUpdates.map((update) => (
                <div key={update.id} className="timeline-item" style={{ paddingBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                      {new Date(update.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="tag tag-blue" style={{ fontSize: "0.625rem" }}>
                      {projectTitleById.get(update.project_id) ?? "Unknown"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>
                    {update.update_note}
                  </p>
                  {update.learned && (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      💡 {update.learned}
                    </p>
                  )}
                  {update.stats && (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      📊 {update.stats}
                    </p>
                  )}
                  {update.progress_percent !== null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <div className="progress-bar" style={{ width: 80 }}>
                        <div className="progress-fill" style={{ width: `${update.progress_percent}%` }} />
                      </div>
                      <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{update.progress_percent}%</span>
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

"use client";

import { useState, useCallback } from "react";
import type { CheckinField, CheckinFieldType, TrackedAreaConfig, IntegrationsConfig } from "@/lib/types";
import {
  saveCheckinFields,
  saveTrackedAreas,
  saveReviewContext,
  saveTimezone,
  saveIntegrations,
} from "@/app/actions/settings";

/* ─── Helpers ─── */
function generateFieldId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 30) || `field_${Date.now()}`;
}

/* ─── Check-in Fields Editor ─── */
function CheckinFieldsEditor({
  initialFields,
}: {
  initialFields: CheckinField[];
}) {
  const [fields, setFields] = useState<CheckinField[]>(initialFields);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addField = useCallback(() => {
    setFields((prev) => [
      ...prev,
      {
        id: `field_${Date.now()}`,
        label: "",
        type: "text" as CheckinFieldType,
        required: false,
        placeholder: "",
      },
    ]);
    setSaved(false);
  }, []);

  const updateField = useCallback(
    (index: number, updates: Partial<CheckinField>) => {
      setFields((prev) =>
        prev.map((f, i) => (i === index ? { ...f, ...updates } : f)),
      );
      setSaved(false);
    },
    [],
  );

  const removeField = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }, []);

  const moveField = useCallback((index: number, direction: "up" | "down") => {
    setFields((prev) => {
      const next = [...prev];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= next.length) return prev;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
    setSaved(false);
  }, []);

  const handleSave = async () => {
    // Auto-generate IDs from labels for fields with empty/temporary IDs
    const processed = fields.map((f) => ({
      ...f,
      id: f.id.startsWith("field_") && f.label ? generateFieldId(f.label) : f.id,
    }));

    setSaving(true);
    try {
      await saveCheckinFields(processed);
      setFields(processed);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to save check-in fields.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: 24 }}>
      <div className="glass-card-body">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 className="section-title">Check-in Questions</h2>
            <p className="section-subtitle">
              Customize the questions in your daily check-in form.
            </p>
          </div>
          <button
            type="button"
            onClick={addField}
            className="btn btn-secondary btn-sm"
          >
            + Add field
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fields.map((field, index) => (
            <div
              key={field.id + index}
              className="list-item"
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {/* Reorder buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button
                    type="button"
                    onClick={() => moveField(index, "up")}
                    disabled={index === 0}
                    className="btn btn-secondary"
                    style={{
                      padding: "2px 6px",
                      fontSize: "0.625rem",
                      lineHeight: 1,
                      opacity: index === 0 ? 0.3 : 1,
                      minWidth: "auto",
                    }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveField(index, "down")}
                    disabled={index === fields.length - 1}
                    className="btn btn-secondary"
                    style={{
                      padding: "2px 6px",
                      fontSize: "0.625rem",
                      lineHeight: 1,
                      opacity: index === fields.length - 1 ? 0.3 : 1,
                      minWidth: "auto",
                    }}
                  >
                    ▼
                  </button>
                </div>

                {/* Label */}
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  placeholder="Question label"
                  className="input"
                  style={{ flex: "2 1 200px" }}
                />

                {/* Type */}
                <select
                  value={field.type}
                  onChange={(e) => updateField(index, { type: e.target.value as CheckinFieldType })}
                  className="select"
                  style={{ flex: "0 0 120px" }}
                >
                  <option value="text">Short text</option>
                  <option value="textarea">Long text</option>
                  <option value="number">Number</option>
                </select>

                {/* Required toggle */}
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--text-secondary)", cursor: "pointer", whiteSpace: "nowrap" }}>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    style={{ accentColor: "var(--accent-from)" }}
                  />
                  Required
                </label>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: "#f87171", padding: "4px 10px", minWidth: "auto" }}
                >
                  ✕
                </button>
              </div>

              {/* Placeholder */}
              <input
                type="text"
                value={field.placeholder ?? ""}
                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                placeholder="Placeholder text (optional)"
                className="input"
                style={{ fontSize: "0.75rem" }}
              />
            </div>
          ))}
        </div>

        {fields.length === 0 && (
          <div className="empty-state" style={{ padding: "24px 0" }}>
            <div className="empty-state-icon">📝</div>
            <p className="empty-state-text">No fields configured. Add at least one check-in question.</p>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Saving..." : "Save check-in fields"}
          </button>
          {saved && (
            <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Tracked Areas Editor ─── */
function TrackedAreasEditor({
  initialAreas,
}: {
  initialAreas: TrackedAreaConfig[];
}) {
  const [areas, setAreas] = useState<TrackedAreaConfig[]>(initialAreas);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addArea = useCallback(() => {
    setAreas((prev) => [...prev, { name: "", aliases: [] }]);
    setSaved(false);
  }, []);

  const updateArea = useCallback(
    (index: number, updates: Partial<TrackedAreaConfig>) => {
      setAreas((prev) =>
        prev.map((a, i) => (i === index ? { ...a, ...updates } : a)),
      );
      setSaved(false);
    },
    [],
  );

  const removeArea = useCallback((index: number) => {
    setAreas((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    const cleaned = areas.filter((a) => a.name.trim());
    setSaving(true);
    try {
      await saveTrackedAreas(cleaned);
      setAreas(cleaned);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to save tracked areas.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: 24 }}>
      <div className="glass-card-body">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 className="section-title">Tracked Areas</h2>
            <p className="section-subtitle">
              Define areas you want to track for skill-gap analysis. Add keywords so the system can detect mentions.
            </p>
          </div>
          <button
            type="button"
            onClick={addArea}
            className="btn btn-secondary btn-sm"
          >
            + Add area
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {areas.map((area, index) => (
            <div
              key={index}
              className="list-item"
              style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}
            >
              <input
                type="text"
                value={area.name}
                onChange={(e) => updateArea(index, { name: e.target.value })}
                placeholder="Area name (e.g. Music Theory, Essay Writing)"
                className="input"
                style={{ flex: "1 1 200px" }}
              />
              <input
                type="text"
                value={area.aliases.join(", ")}
                onChange={(e) =>
                  updateArea(index, {
                    aliases: e.target.value
                      .split(",")
                      .map((s) => s.trim().toLowerCase())
                      .filter(Boolean),
                  })
                }
                placeholder="Keywords (comma-separated)"
                className="input"
                style={{ flex: "1 1 250px", fontSize: "0.75rem" }}
              />
              <button
                type="button"
                onClick={() => removeArea(index)}
                className="btn btn-secondary btn-sm"
                style={{ color: "#f87171", padding: "4px 10px", minWidth: "auto" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {areas.length === 0 && (
          <div className="empty-state" style={{ padding: "24px 0" }}>
            <div className="empty-state-icon">🎯</div>
            <p className="empty-state-text">
              No tracked areas yet. Add areas like &quot;Piano Practice&quot;, &quot;Writing&quot;, &quot;Fitness&quot;, or &quot;Dynamic Programming&quot;.
            </p>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Saving..." : "Save tracked areas"}
          </button>
          {saved && (
            <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Review Context Editor ─── */
function ReviewContextEditor({ initialContext }: { initialContext: string }) {
  const [context, setContext] = useState(initialContext);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveReviewContext(context);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to save review context.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: 24 }}>
      <div className="glass-card-body">
        <h2 className="section-title">Review Context</h2>
        <p className="section-subtitle" style={{ marginBottom: 16 }}>
          Tell the AI about yourself so weekly reviews are personalized. Example: &quot;I&apos;m a jazz guitarist focused on improvisation and music theory&quot; or &quot;I&apos;m a pre-med student balancing MCAT prep with clinical rotations&quot;.
        </p>

        <textarea
          value={context}
          onChange={(e) => {
            setContext(e.target.value);
            setSaved(false);
          }}
          rows={4}
          className="textarea"
          placeholder="Describe who you are and what you're working on. This helps the AI give relevant, personalized feedback..."
        />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Saving..." : "Save context"}
          </button>
          {saved && (
            <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Timezone Selector ─── */
const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function TimezoneSelector({ initialTimezone }: { initialTimezone: string }) {
  const [tz, setTz] = useState(initialTimezone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTimezone(tz);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to save timezone.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: 24 }}>
      <div className="glass-card-body">
        <h2 className="section-title">Timezone</h2>
        <p className="section-subtitle" style={{ marginBottom: 16 }}>
          Used for scheduling daily check-in reminders and streak calculations.
        </p>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={tz}
            onChange={(e) => {
              setTz(e.target.value);
              setSaved(false);
            }}
            className="select"
            style={{ flex: "1 1 250px" }}
          >
            {COMMON_TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary btn-sm"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {saved && (
            <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Integrations Toggle ─── */
function IntegrationsToggle({ initialIntegrations }: { initialIntegrations: IntegrationsConfig }) {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: "github" | "leetcode") => {
    setIntegrations((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveIntegrations(integrations);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to save integrations.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: 24 }}>
      <div className="glass-card-body">
        <h2 className="section-title">Integrations</h2>
        <p className="section-subtitle" style={{ marginBottom: 16 }}>
          Enable optional platform integrations. These add extra data signals to your analytics.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label className="list-item" style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={integrations.github}
              onChange={() => handleToggle("github")}
              style={{ accentColor: "var(--accent-from)", width: 18, height: 18 }}
            />
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                GitHub
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Analyze repos, languages, and infer skills from your public profile.
              </div>
            </div>
          </label>

          <label className="list-item" style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={integrations.leetcode}
              onChange={() => handleToggle("leetcode")}
              style={{ accentColor: "var(--accent-from)", width: 18, height: 18 }}
            />
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                LeetCode
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Track problem-solving stats, difficulty distribution, and topic coverage.
              </div>
            </div>
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Saving..." : "Save integrations"}
          </button>
          {saved && (
            <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Settings Form ─── */
export default function SettingsForm({
  settings,
}: {
  settings: {
    checkin_fields: CheckinField[];
    tracked_areas: TrackedAreaConfig[];
    review_context: string;
    timezone: string;
    integrations: IntegrationsConfig;
  };
}) {
  return (
    <>
      <CheckinFieldsEditor initialFields={settings.checkin_fields} />
      <TrackedAreasEditor initialAreas={settings.tracked_areas} />
      <ReviewContextEditor initialContext={settings.review_context} />
      <TimezoneSelector initialTimezone={settings.timezone} />
      <IntegrationsToggle initialIntegrations={settings.integrations} />
    </>
  );
}

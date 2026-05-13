export default function CheckinSuccessPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div className="ambient-bg" />
      <div
        className="glass-card"
        style={{
          maxWidth: 480,
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          className="glass-card-body"
          style={{ textAlign: "center", padding: "48px 32px" }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--success-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "1.75rem",
            }}
          >
            ✅
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Check-in submitted!
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            Your response has been saved and your streak updated.
            This link cannot be used again.
          </p>
          <div
            style={{
              padding: "12px 20px",
              borderRadius: "var(--radius-md)",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.15)",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                color: "#34d399",
                fontWeight: 500,
              }}
            >
              🔥 Keep the streak alive — 1% better every day!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

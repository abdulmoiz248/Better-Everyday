"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateWeeklyReviewButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReview = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/weekly-review/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate weekly review");
      }

      setMessage("✅ Weekly review generated!");
      router.refresh();
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        onClick={handleGenerateReview}
        disabled={loading}
        className="btn btn-primary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        {loading ? "Generating..." : "Generate Weekly Review"}
      </button>
      {message && (
        <span style={{ fontSize: "0.75rem", color: "#34d399" }}>{message}</span>
      )}
      {error && (
        <span style={{ fontSize: "0.75rem", color: "#f87171" }}>{error}</span>
      )}
    </div>
  );
}

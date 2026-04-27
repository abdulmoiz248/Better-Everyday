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
    <div className="space-y-2">
      <button
        onClick={handleGenerateReview}
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-zinc-400"
      >
        {loading ? "Generating..." : "Generate Weekly Review"}
      </button>
      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Star, CheckCircle, Loader2, ExternalLink } from "lucide-react";

type TenantPublic = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  googleReviewUrl: string;
  address: string | null;
  aiContext: string | null;
};

type Stage =
  | "loading"
  | "rating"
  | "feedback"
  | "google-redirect"
  | "thank-you"
  | "error";

export default function ReviewFunnelPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const [tenant, setTenant] = useState<TenantPublic | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showPasteHint, setShowPasteHint] = useState(false);

  // Fetch tenant + extract requestId from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const rid = searchParams.get("r");
    setRequestId(rid);

    fetch(`/api/public/tenant/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setTenant(json.data);
          setStage("rating");
          // Mark as opened if we have a requestId
          if (rid) {
            fetch(`/api/public/review?id=${rid}`, { method: "PATCH" }).catch(
              () => {}
            );
          }
        } else {
          setStage("error");
        }
      })
      .catch(() => setStage("error"));
  }, [slug]);

  const handleRatingSelect = async (rating: number) => {
    setSelectedRating(rating);
    if (rating >= 4) {
      setStage("google-redirect");
      submitRating(rating);
      // Fetch AI suggestions in parallel — non-blocking
      setLoadingSuggestions(true);
      try {
        const res = await fetch("/api/public/ai-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: tenant?.name ?? "this business",
            rating,
            address: tenant?.address ?? undefined,
            aiContext: tenant?.aiContext ?? undefined,
          }),
        });
        const json = await res.json();
        if (Array.isArray(json.data)) setSuggestions(json.data);
      } catch {
        // Fail silently — funnel still works without suggestions
      } finally {
        setLoadingSuggestions(false);
      }
    } else {
      setStage("feedback");
    }
  };

  const submitRating = async (rating: number, privateFeedback?: string) => {
    if (!requestId) return;
    setSubmitting(true);
    try {
      await fetch("/api/public/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          rating,
          ...(privateFeedback && { privateFeedback }),
        }),
      });
    } catch {
      // Non-blocking — funnel still works without this
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRating(selectedRating, feedback);
    setStage("thank-you");
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const useThisReview = (text: string, index: number) => {
    // Copy to clipboard
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    // Open Google review page in new tab simultaneously
    window.open(tenant!.googleReviewUrl, "_blank", "noopener,noreferrer");
    // Show paste hint banner
    setShowPasteHint(true);
    setTimeout(() => {
      setCopiedIndex(null);
      setShowPasteHint(false);
    }, 8000);
  };

  // ── Render stages ──────────────────────────────────────────────────────────

  if (stage === "loading") {
    return (
      <FunnelShell>
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </FunnelShell>
    );
  }

  if (stage === "error" || !tenant) {
    return (
      <FunnelShell>
        <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
          <div className="text-4xl">🔍</div>
          <h2 className="text-lg font-semibold text-gray-900">
            Page Not Found
          </h2>
          <p className="text-sm text-gray-500">
            This review link doesn&apos;t exist or has been deactivated.
          </p>
        </div>
      </FunnelShell>
    );
  }

  if (stage === "rating") {
    return (
      <FunnelShell>
        <div className="flex flex-col items-center gap-6 px-6 py-10 text-center">
          {/* Business branding */}
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-600">
            {tenant.name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              How was your experience?
            </p>
          </div>

          {/* Star rating */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => handleRatingSelect(star)}
                className="transition-transform hover:scale-110 active:scale-95"
                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
              >
                <Star
                  className={`w-12 h-12 transition-colors ${
                    star <= (hoveredRating || selectedRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-200 fill-gray-200"
                  }`}
                />
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            Tap a star to rate your experience
          </p>
        </div>
      </FunnelShell>
    );
  }

  if (stage === "feedback") {
    return (
      <FunnelShell>
        <div className="flex flex-col gap-6 px-6 py-8">
          <div className="text-center">
            <div className="text-4xl mb-3">💬</div>
            <h2 className="text-lg font-bold text-gray-900">
              We&apos;re Sorry to Hear That
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Please tell us what went wrong — your feedback goes directly to
              the owner.
            </p>
          </div>

          {/* Show selected rating */}
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 ${
                  star <= selectedRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200 fill-gray-200"
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what happened..."
              rows={4}
              maxLength={2000}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              type="submit"
              disabled={submitting || !feedback.trim()}
              className="w-full py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </div>
      </FunnelShell>
    );
  }

  if (stage === "google-redirect") {
    return (
      <FunnelShell>
        <div className="flex flex-col gap-5 px-6 py-8">
          {/* Paste hint banner */}
          {showPasteHint && (
            <div className="bg-green-500 text-white text-center text-sm font-semibold py-3 px-4 rounded-xl">
              ✅ Review copied! Press <kbd className="bg-green-700 px-1.5 py-0.5 rounded text-xs">Ctrl+V</kbd> (or tap &amp; hold) to paste in Google
            </div>
          )}

          <div className="text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-lg font-bold text-gray-900">
              {"★".repeat(selectedRating)} Thank you!
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Tap <strong>Use This Review</strong> — it copies the text and opens Google at the same time.
            </p>
          </div>

          {/* AI Suggestions */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              ✨ Pick a review draft:
            </p>

            {loadingSuggestions ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-4/5 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-3/5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border transition-colors ${
                      copiedIndex === i
                        ? "border-green-400 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <p className="px-4 pt-4 pb-3 text-sm text-gray-700 leading-relaxed">
                      {suggestion}
                    </p>
                    <button
                      onClick={() => useThisReview(suggestion, i)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-b-xl transition-colors border-t ${
                        copiedIndex === i
                          ? "bg-green-500 text-white border-green-400"
                          : "bg-white text-blue-600 border-gray-200 hover:bg-blue-50"
                      }`}
                    >
                      {copiedIndex === i ? (
                        <>✅ Copied — paste in Google</>
                      ) : (
                        <><ExternalLink className="w-3.5 h-3.5" /> Use This Review</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fallback manual open */}
          <a
            href={tenant.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-xs text-blue-500 hover:underline"
          >
            Already copied? Open Google Reviews →
          </a>
        </div>
      </FunnelShell>
    );
  }

  if (stage === "thank-you") {
    return (
      <FunnelShell>
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <h2 className="text-xl font-bold text-gray-900">
            Thank You for Your Feedback!
          </h2>
          <p className="text-sm text-gray-500 max-w-xs">
            Your feedback has been received. We take every comment seriously and
            will use it to improve.
          </p>
        </div>
      </FunnelShell>
    );
  }

  return null;
}

// ── Shell wrapper ──────────────────────────────────────────────────────────────
function FunnelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        {children}
        <div className="px-6 py-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <span className="font-semibold text-gray-500">ReviewFlow AI</span>
          </p>
        </div>
      </div>
    </div>
  );
}

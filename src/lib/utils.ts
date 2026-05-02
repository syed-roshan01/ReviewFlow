import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a phone number for display.
 * Input: +15555550101 → Output: +1 (555) 555-0101
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Convert a raw business name into a URL-safe slug.
 * "Demo Restaurant" → "demo-restaurant"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Calculate conversion rate as a percentage string.
 */
export function conversionRate(completed: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((completed / total) * 100)}%`;
}

/**
 * Return a friendly relative time string.
 * e.g. "2 days ago", "just now"
 */
export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

/**
 * Build the public review funnel URL for a tenant.
 */
export function buildReviewUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://review-flow-l5yo.vercel.app";
  return `${base}/r/${slug}`;
}

/**
 * Generate AI review suggestions based on the rating.
 * In MVP this is template-based; swap for OpenAI call post-MVP.
 */
export function getReviewSuggestions(
  businessName: string,
  rating: number
): string[] {
  const templates: Record<number, string[]> = {
    5: [
      `Amazing experience at ${businessName}! The service was top-notch and I'll definitely be coming back. Highly recommend!`,
      `${businessName} exceeded all my expectations. Wonderful staff, great atmosphere, and outstanding quality. 5 stars!`,
      `One of the best visits I've had. ${businessName} truly cares about their customers — you can feel it in every detail.`,
    ],
    4: [
      `Really enjoyed my visit to ${businessName}. Great service and quality — would definitely return.`,
      `${businessName} delivered a great experience. Minor room for improvement but overall very happy!`,
      `Solid experience at ${businessName}. Friendly staff and good quality — a reliable choice.`,
    ],
  };
  return templates[rating] ?? templates[4];
}

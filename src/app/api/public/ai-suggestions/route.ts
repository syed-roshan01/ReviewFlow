/**
 * POST /api/public/ai-suggestions
 *
 * Generates 3 SEO-optimised, humanized Google review drafts using OpenAI.
 * - In-memory cache: same business+rating returns instantly after first call
 * - Rate limiting: 3 AI calls per IP per hour → fallback if exceeded (no error)
 * - Daily budget cap: 180 calls/day max (protects free 200 RPD OpenAI quota)
 * - All limits hit fallback templates silently — funnel never breaks
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const RequestSchema = z.object({
  businessName: z.string().min(1).max(100),
  rating: z.number().int().min(4).max(5),
  address: z.string().max(200).optional(),
  aiContext: z.string().max(2000).optional(),
});

// ─── In-memory cache ──────────────────────────────────────────────────────────
// Same business + rating → return cached result instantly (no OpenAI call)
const suggestionCache = new Map<string, { data: string[]; expires: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// ─── Rate limiter (per IP) ────────────────────────────────────────────────────
// 3 AI calls per IP per hour → over limit = silent fallback, not an error
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

// ─── Daily budget cap ─────────────────────────────────────────────────────────
// Protects free OpenAI tier (200 RPD limit). Reset at midnight UTC.
let dailyCallCount = 0;
let dailyResetDate = new Date().toISOString().slice(0, 10);
const DAILY_CAP = 180;

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false; // not limited
  }
  if (entry.count >= RATE_LIMIT) return true; // limited
  entry.count++;
  return false;
}

function checkDailyBudget(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyResetDate) {
    dailyCallCount = 0;
    dailyResetDate = today;
  }
  if (dailyCallCount >= DAILY_CAP) return true; // over budget
  dailyCallCount++;
  return false;
}

export async function POST(req: Request) {
  let businessName = "this business";
  let rating = 5;

  try {
    const body = await req.json();
    const parsed = RequestSchema.parse(body);
    businessName = parsed.businessName;
    rating = parsed.rating;
    const { address, aiContext } = parsed;

    // 1. Check cache first — instant response, zero OpenAI cost
    const cacheKey = `${businessName.toLowerCase().replace(/\s+/g, "_")}-${rating}`;
    const cached = suggestionCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return NextResponse.json({ data: cached.data });
    }

    // 2. No OpenAI key → use fallback
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ data: getFallbackSuggestions(businessName, rating) });
    }

    // 3. Rate limit check (silent fallback, no error exposed to customer)
    const ip = getClientIp(req);
    if (checkRateLimit(ip) || checkDailyBudget()) {
      return NextResponse.json({ data: getFallbackSuggestions(businessName, rating) });
    }

    // 4. Call OpenAI
    const starWord = rating === 5 ? "exceptional 5-star" : "great 4-star";
    const contextParts: string[] = [];
    if (address) contextParts.push(`Location: ${address}`);
    if (aiContext) contextParts.push(`Business details:\n${aiContext}`);

    const prompt = `Write 3 authentic Google review drafts for a customer who just had a ${starWord} experience at "${businessName}".
${contextParts.length ? `\nContext:\n${contextParts.join("\n")}\n` : ""}
Rules:
- Sound like a real human, warm and natural
- Mention "${businessName}" at least once per review
- Vary length: short (~35 words), medium (~60 words), longer (~85 words)
- Vary tone: enthusiastic / casual / professional
- No generic filler, no "Google" or "review" in the text
- Ready to copy-paste, no placeholders

Return ONLY a JSON array of exactly 3 strings: ["review1", "review2", "review3"]`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 450,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";

    let suggestions: string[] = [];
    try {
      // Strip markdown code fences if present
      const clean = raw.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(clean);
      suggestions = Array.isArray(parsed)
        ? parsed
        : (Object.values(parsed).find((v) => Array.isArray(v)) as string[]) ?? [];
    } catch {
      suggestions = getFallbackSuggestions(businessName, rating);
    }

    const valid = suggestions
      .filter((s) => typeof s === "string" && s.trim().length > 0)
      .slice(0, 3);

    while (valid.length < 3) {
      valid.push(getFallbackSuggestions(businessName, rating)[valid.length]);
    }

    // 5. Store in cache for future requests
    suggestionCache.set(cacheKey, { data: valid, expires: Date.now() + CACHE_TTL });

    return NextResponse.json({ data: valid });

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", issues: err.issues },
        { status: 422 }
      );
    }
    console.error("[AI Suggestions Error]", err);
    return NextResponse.json({ data: getFallbackSuggestions(businessName, rating) });
  }
}

/**
 * Fallback template suggestions — used when OpenAI is unavailable.
 * Decent quality, no API cost.
 */
function getFallbackSuggestions(businessName: string, rating: number): string[] {
  if (rating === 5) {
    return [
      `${businessName} absolutely delivered. From the moment I walked in, everything felt right — attentive staff, great quality, and an atmosphere that made me want to stay longer. This is now my go-to spot.`,
      `Five stars without hesitation. ${businessName} stands out from the crowd with genuinely excellent service and attention to detail. You can tell they actually care about the customer experience. Will be back.`,
      `Came here on a recommendation and I'm so glad I did. ${businessName} exceeded every expectation — top-notch from start to finish. Already planning my next visit!`,
    ];
  }
  return [
    `Really solid experience at ${businessName}. The staff were friendly, the quality was great, and everything ran smoothly. A reliable choice I'd recommend to anyone in the area.`,
    `${businessName} delivered exactly what I was hoping for. Good value, pleasant atmosphere, and people who clearly take pride in what they do. Definitely coming back.`,
    `Had a great visit to ${businessName}. Everything was well-handled and the team was genuinely welcoming. Minor things could be tweaked but overall a very positive experience.`,
  ];
}

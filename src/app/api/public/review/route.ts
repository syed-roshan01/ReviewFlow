/**
 * Public API — no auth required
 *
 * POST /api/public/review
 *
 * Endpoint called by the review funnel page when a customer submits:
 *   - Their rating (1–5)
 *   - Private feedback (if rating ≤ 3)
 *
 * Marks the ReviewRequest as OPENED on first load (handled separately),
 * then as REDIRECTED or NEGATIVE_FEEDBACK on submission.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const SubmitReviewSchema = z.object({
  requestId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  privateFeedback: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = SubmitReviewSchema.parse(body);

    const reviewRequest = await prisma.reviewRequest.findUnique({
      where: { id: data.requestId },
      include: { tenant: { select: { googleReviewUrl: true } } },
    });

    if (!reviewRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Idempotency — already processed
    if (
      reviewRequest.status === "REDIRECTED" ||
      reviewRequest.status === "NEGATIVE_FEEDBACK" ||
      reviewRequest.status === "COMPLETED"
    ) {
      return NextResponse.json({
        data: {
          status: reviewRequest.status,
          googleReviewUrl: reviewRequest.tenant.googleReviewUrl,
        },
      });
    }

    const isPositive = data.rating >= 4;

    const updated = await prisma.reviewRequest.update({
      where: { id: data.requestId },
      data: {
        rating: data.rating,
        status: isPositive ? "REDIRECTED" : "NEGATIVE_FEEDBACK",
        privateFeedback: isPositive ? undefined : (data.privateFeedback ?? null),
        redirectedAt: isPositive ? new Date() : undefined,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      data: {
        status: updated.status,
        googleReviewUrl: isPositive
          ? reviewRequest.tenant.googleReviewUrl
          : null,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: err.issues },
        { status: 422 }
      );
    }
    console.error("[Public Review Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Mark as OPENED ─────────────────────────────────────────────────────────────
// Called when the review page loads (track open rate)
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("id");

    if (!requestId || !/^[a-z0-9]+$/.test(requestId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await prisma.reviewRequest.updateMany({
      where: { id: requestId, status: "SENT" },
      data: { status: "OPENED" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Mark Opened Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

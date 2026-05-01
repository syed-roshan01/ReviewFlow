import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

type Params = { params: { id: string } };

// ── PATCH /api/review-requests/[id] ─────────────────────────────────────────
// Called when a customer submits their rating on the review funnel page
const UpdateReviewRequestSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  privateFeedback: z.string().max(2000).optional(),
  status: z
    .enum([
      "SENT",
      "OPENED",
      "REDIRECTED",
      "NEGATIVE_FEEDBACK",
      "COMPLETED",
      "EXPIRED",
    ])
    .optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { tenantUser } = await getAuthContext();
    const body = await req.json();
    const data = UpdateReviewRequestSchema.parse(body);

    const existing = await prisma.reviewRequest.findFirst({
      where: { id: params.id, tenantId: tenantUser.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.reviewRequest.update({
      where: { id: params.id },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.privateFeedback !== undefined && {
          privateFeedback: data.privateFeedback,
        }),
        ...(data.status && { status: data.status }),
        ...(data.status === "REDIRECTED" && { redirectedAt: new Date() }),
        ...(data.status &&
          ["REDIRECTED", "NEGATIVE_FEEDBACK", "COMPLETED"].includes(
            data.status
          ) && { completedAt: new Date() }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    return handleError(err);
  }
}

function handleError(err: unknown): NextResponse {
  if (err instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Validation error", issues: err.issues },
      { status: 422 }
    );
  }
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error("[API Error]", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

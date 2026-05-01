import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { sendReviewRequest } from "@/lib/whatsapp";
import { buildReviewUrl } from "@/lib/utils";

// ── GET /api/review-requests ─────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { tenantUser } = await getAuthContext();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Number(searchParams.get("limit") ?? "20"));
    const status = searchParams.get("status") ?? undefined;

    const where = {
      tenantId: tenantUser.tenantId,
      ...(status && { status: status as never }),
    };

    const [requests, total] = await Promise.all([
      prisma.reviewRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { customer: { select: { id: true, name: true, phone: true } } },
      }),
      prisma.reviewRequest.count({ where }),
    ]);

    return NextResponse.json({
      data: requests,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return handleError(err);
  }
}

// ── POST /api/review-requests ────────────────────────────────────────────────
// Create a review request for a customer and fire the WhatsApp message
const CreateReviewRequestSchema = z.object({
  customerId: z.string().cuid(),
});

export async function POST(req: Request) {
  try {
    const { tenantUser } = await getAuthContext();
    const body = await req.json();
    const { customerId } = CreateReviewRequestSchema.parse(body);

    // Verify customer belongs to this tenant
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId: tenantUser.tenantId },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const tenant = tenantUser.tenant;

    // Create the review request record
    const reviewRequest = await prisma.reviewRequest.create({
      data: {
        tenantId: tenantUser.tenantId,
        customerId,
        status: "SENT",
      },
    });

    // Send WhatsApp message (non-blocking — log failure but don't throw)
    let waMessageId: string | null = null;
    let waStatus: "SENT" | "FAILED" = "SENT";
    let failureReason: string | undefined;

    try {
      const result = await sendReviewRequest({
        phone: customer.phone,
        customerName: customer.name,
        businessName: tenant.name,
        reviewUrl: buildReviewUrl(tenant.slug),
      });
      waMessageId = result.messageId;
    } catch (err) {
      waStatus = "FAILED";
      failureReason = String(err);
      console.error("[WhatsApp send failed]", err);
    }

    // Log the WhatsApp message
    await prisma.whatsAppMessage.create({
      data: {
        tenantId: tenantUser.tenantId,
        customerId,
        type: "REVIEW_REQUEST",
        status: waStatus,
        phone: customer.phone,
        templateName: "review_request_v1",
        provider: process.env.WHATSAPP_PROVIDER ?? "none",
        providerMsgId: waMessageId,
        sentAt: waStatus === "SENT" ? new Date() : undefined,
        failureReason,
      },
    });

    return NextResponse.json({ data: reviewRequest }, { status: 201 });
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

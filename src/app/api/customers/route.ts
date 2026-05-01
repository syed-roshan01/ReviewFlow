import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { slugify } from "@/lib/utils";

// ── GET /api/customers ───────────────────────────────────────────────────────
// List all customers for the authenticated tenant (paginated)
export async function GET(req: Request) {
  try {
    const { tenantUser } = await getAuthContext();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Number(searchParams.get("limit") ?? "20"));
    const search = searchParams.get("search") ?? "";
    const tag = searchParams.get("tag") ?? undefined;

    const where = {
      tenantId: tenantUser.tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(tag && { tag: tag as never }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { lastVisitAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { reviewRequests: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      data: customers,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return handleError(err);
  }
}

// ── POST /api/customers ──────────────────────────────────────────────────────
// Add a new customer (or update if phone already exists) + optionally send WA
const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Phone must be E.164 format"),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  sendReviewRequest: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const { tenantUser } = await getAuthContext();
    const body = await req.json();
    const data = CreateCustomerSchema.parse(body);

    // Upsert: increment visitCount if phone already exists for this tenant
    const customer = await prisma.customer.upsert({
      where: {
        tenantId_phone: {
          tenantId: tenantUser.tenantId,
          phone: data.phone,
        },
      },
      update: {
        name: data.name,
        email: data.email || undefined,
        notes: data.notes,
        visitCount: { increment: 1 },
        tag: "REPEAT",
        lastVisitAt: new Date(),
      },
      create: {
        tenantId: tenantUser.tenantId,
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        notes: data.notes,
        tag: "NEW",
      },
    });

    // Optionally fire a review request
    if (data.sendReviewRequest) {
      // Enqueue via /api/review-requests — keep concerns separated
      await triggerReviewRequest(tenantUser.tenantId, customer.id);
    }

    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
async function triggerReviewRequest(tenantId: string, customerId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  if (!tenant || !customer) return;

  const { sendReviewRequest: sendWa } = await import("@/lib/whatsapp");
  const { buildReviewUrl } = await import("@/lib/utils");

  const reviewRequest = await prisma.reviewRequest.create({
    data: { tenantId, customerId, status: "SENT" },
  });

  try {
    const { messageId } = await sendWa({
      phone: customer.phone,
      customerName: customer.name,
      businessName: tenant.name,
      reviewUrl: buildReviewUrl(tenant.slug),
    });

    await prisma.whatsAppMessage.create({
      data: {
        tenantId,
        customerId,
        type: "REVIEW_REQUEST",
        status: "SENT",
        phone: customer.phone,
        templateName: "review_request_v1",
        provider: process.env.WHATSAPP_PROVIDER ?? "none",
        providerMsgId: messageId,
        sentAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.whatsAppMessage.create({
      data: {
        tenantId,
        customerId,
        type: "REVIEW_REQUEST",
        status: "FAILED",
        phone: customer.phone,
        templateName: "review_request_v1",
        provider: process.env.WHATSAPP_PROVIDER ?? "none",
        failureReason: String(err),
      },
    });
  }

  return reviewRequest;
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
    if (err.message === "TENANT_NOT_FOUND")
      return NextResponse.json(
        { error: "Tenant not found. Complete onboarding." },
        { status: 403 }
      );
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  console.error("[API Error]", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

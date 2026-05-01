import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

type Params = { params: { id: string } };

// ── GET /api/customers/[id] ──────────────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantUser } = await getAuthContext();

    const customer = await prisma.customer.findFirst({
      where: { id: params.id, tenantId: tenantUser.tenantId },
      include: {
        reviewRequests: { orderBy: { createdAt: "desc" }, take: 10 },
        whatsappMessages: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: customer });
  } catch (err) {
    return handleError(err);
  }
}

// ── PATCH /api/customers/[id] ────────────────────────────────────────────────
const UpdateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  tag: z.enum(["NEW", "REPEAT", "VIP", "AT_RISK"]).optional(),
  notes: z.string().max(500).optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { tenantUser } = await getAuthContext();
    const body = await req.json();
    const data = UpdateCustomerSchema.parse(body);

    const existing = await prisma.customer.findFirst({
      where: { id: params.id, tenantId: tenantUser.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.tag && { tag: data.tag }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    return handleError(err);
  }
}

// ── DELETE /api/customers/[id] ───────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { tenantUser } = await getAuthContext();

    const existing = await prisma.customer.findFirst({
      where: { id: params.id, tenantId: tenantUser.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.customer.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
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
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  console.error("[API Error]", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

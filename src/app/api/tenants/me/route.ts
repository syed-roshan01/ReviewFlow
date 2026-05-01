import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { slugify } from "@/lib/utils";

// ── GET /api/tenants/me ──────────────────────────────────────────────────────
// Returns the current tenant's full profile
export async function GET() {
  try {
    const { tenantUser } = await getAuthContext();

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantUser.tenantId },
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: tenant });
  } catch (err) {
    return handleError(err);
  }
}

// ── PATCH /api/tenants/me ────────────────────────────────────────────────────
const UpdateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  googleReviewUrl: z.string().url().optional(),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/)
    .optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().url().optional(),
  address: z.string().max(300).optional(),
  aiContext: z.string().max(2000).optional(),
});

export async function PATCH(req: Request) {
  try {
    const { tenantUser } = await getAuthContext();

    // Only OWNER or ADMIN can update tenant settings
    if (!["OWNER", "ADMIN"].includes(tenantUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = UpdateTenantSchema.parse(body);

    const updated = await prisma.tenant.update({
      where: { id: tenantUser.tenantId },
      data: {
        ...(data.name && {
          name: data.name,
          // Re-slug only if there's no other tenant with this slug
          // (skip auto-re-slug to avoid breaking existing QR codes)
        }),
        ...(data.googleReviewUrl && { googleReviewUrl: data.googleReviewUrl }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.logoUrl && { logoUrl: data.logoUrl }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.aiContext !== undefined && { aiContext: data.aiContext }),
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
    if (err.message === "TENANT_NOT_FOUND")
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }
  console.error("[API Error]", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

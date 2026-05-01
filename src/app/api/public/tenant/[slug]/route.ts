/**
 * Public API — no auth required
 *
 * GET /api/public/tenant/[slug]
 * Returns the minimal tenant info needed to render the review funnel page.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { slug: string } };

export async function GET(_req: Request, { params }: Params) {
  // Sanitise slug input
  const slug = params.slug.replace(/[^a-z0-9-]/g, "").slice(0, 100);

  const tenant = await prisma.tenant.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      googleReviewUrl: true,
      address: true,
      aiContext: true,
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: tenant });
}

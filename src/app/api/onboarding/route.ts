/**
 * POST /api/onboarding
 *
 * Called once after a user signs up via Clerk.
 * Creates the Tenant + TenantUser records.
 * Requires Clerk auth — the user must be signed in.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const OnboardingSchema = z.object({
  businessName: z.string().min(2).max(100),
  googleReviewUrl: z.string().url("Must be a valid URL"),
  phone: z
    .string()
    .transform((v) => (v.trim() === "" ? undefined : v.trim()))
    .pipe(
      z
        .string()
        .regex(/^\+[1-9]\d{7,14}$/, "Phone must be E.164 format (+1234567890)")
        .optional()
    )
    .optional(),
  email: z
    .string()
    .transform((v) => (v.trim() === "" ? undefined : v.trim()))
    .pipe(z.string().email().optional())
    .optional(),
  address: z
    .string()
    .transform((v) => (v.trim() === "" ? undefined : v.trim()))
    .pipe(z.string().max(300).optional())
    .optional(),
});

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prevent re-onboarding
    const existing = await prisma.tenantUser.findUnique({
      where: { clerkId: user.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already onboarded", tenantId: existing.tenantId },
        { status: 409 }
      );
    }

    const body = await req.json();
    const data = OnboardingSchema.parse(body);

    // Generate a unique slug
    let slug = slugify(data.businessName);
    const slugConflict = await prisma.tenant.findUnique({ where: { slug } });
    if (slugConflict) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const email =
      data.email ?? user.emailAddresses[0]?.emailAddress ?? undefined;
    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    // Create tenant + user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.businessName,
          slug,
          googleReviewUrl: data.googleReviewUrl,
          phone: data.phone,
          email,
          address: data.address,
        },
      });

      const tenantUser = await tx.tenantUser.create({
        data: {
          tenantId: tenant.id,
          clerkId: user.id,
          email: email ?? "",
          name: name || undefined,
          role: "OWNER",
        },
      });

      return { tenant, tenantUser };
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: err.issues },
        { status: 422 }
      );
    }
    console.error("[Onboarding Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

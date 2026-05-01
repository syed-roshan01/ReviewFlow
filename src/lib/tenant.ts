import { prisma } from "@/lib/prisma";
import type { Tenant } from "@prisma/client";

/**
 * Fetch a tenant by its public slug.
 * Used in the public review funnel page.
 */
export async function getTenantBySlug(
  slug: string
): Promise<Tenant | null> {
  return prisma.tenant.findUnique({
    where: { slug, isActive: true },
  });
}

/**
 * Fetch a tenant by its ID.
 * Used in authenticated dashboard routes.
 */
export async function getTenantById(id: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({
    where: { id, isActive: true },
  });
}

/**
 * Validate that a given tenantId actually belongs to the authenticated user.
 * Prevents cross-tenant data access.
 */
export async function assertTenantAccess(
  tenantId: string,
  clerkId: string
): Promise<void> {
  const tenantUser = await prisma.tenantUser.findFirst({
    where: { tenantId, clerkId },
  });

  if (!tenantUser) {
    throw new Error("FORBIDDEN");
  }
}

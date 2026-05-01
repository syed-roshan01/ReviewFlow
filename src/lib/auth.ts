import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { TenantUser, Tenant } from "@prisma/client";

export type AuthContext = {
  clerkId: string;
  tenantUser: TenantUser & { tenant: Tenant };
};

/**
 * Resolves the current authenticated user's TenantUser record.
 * Throws if not authenticated or no associated tenant found.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  const tenantUser = await prisma.tenantUser.findUnique({
    where: { clerkId: userId },
    include: { tenant: true },
  });

  if (!tenantUser) {
    throw new Error("TENANT_NOT_FOUND");
  }

  if (!tenantUser.tenant.isActive) {
    throw new Error("TENANT_INACTIVE");
  }

  return { clerkId: userId, tenantUser };
}

/**
 * Returns true if the current Clerk user is a super admin.
 * Super admins are configured via SUPER_ADMIN_IDS env var.
 */
export async function isSuperAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const adminIds = (process.env.SUPER_ADMIN_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return adminIds.includes(userId);
}

/**
 * Provision a new TenantUser record after Clerk sign-up.
 * Called during onboarding flow.
 */
export async function provisionTenantUser(
  tenantId: string,
  role: "OWNER" | "ADMIN" | "STAFF" = "OWNER"
): Promise<TenantUser> {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

  return prisma.tenantUser.create({
    data: {
      tenantId,
      clerkId: user.id,
      email,
      name: name || undefined,
      role,
    },
  });
}

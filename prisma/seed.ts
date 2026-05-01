/**
 * Seed script — creates a demo tenant + sample data for development
 * Run with: npm run db:seed
 */
import { PrismaClient, CustomerTag, ReviewRequestStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Demo tenant ──────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-restaurant" },
    update: {},
    create: {
      name: "Demo Restaurant",
      slug: "demo-restaurant",
      googleReviewUrl:
        "https://g.page/r/DEMO_PLACE_ID/review",
      phone: "+15555550100",
      email: "owner@demo-restaurant.com",
      address: "123 Main St, New York, NY 10001",
      planId: "growth",
    },
  });

  console.log(`✅ Tenant: ${tenant.name} (slug: ${tenant.slug})`);

  // ── Sample customers ──────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: "+15555550101" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "Alice Johnson",
        phone: "+15555550101",
        email: "alice@example.com",
        tag: CustomerTag.VIP,
        visitCount: 7,
        lastVisitAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: "+15555550102" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "Bob Martinez",
        phone: "+15555550102",
        tag: CustomerTag.REPEAT,
        visitCount: 3,
        lastVisitAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: "+15555550103" } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: "Carol White",
        phone: "+15555550103",
        tag: CustomerTag.NEW,
        visitCount: 1,
        lastVisitAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers`);

  // ── Sample review requests ────────────────────────────
  await prisma.reviewRequest.createMany({
    skipDuplicates: true,
    data: [
      {
        tenantId: tenant.id,
        customerId: customers[0].id,
        status: ReviewRequestStatus.REDIRECTED,
        rating: 5,
        redirectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        tenantId: tenant.id,
        customerId: customers[1].id,
        status: ReviewRequestStatus.NEGATIVE_FEEDBACK,
        rating: 2,
        privateFeedback: "The wait time was too long.",
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        tenantId: tenant.id,
        customerId: customers[2].id,
        status: ReviewRequestStatus.SENT,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("✅ Created sample review requests");
  console.log("\n🎉 Seeding complete!");
  console.log(`\nReview funnel URL: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/r/${tenant.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

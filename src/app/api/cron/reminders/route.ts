/**
 * Cron Job — Send 24h Review Reminders
 *
 * POST /api/cron/reminders
 *
 * Triggered by Vercel Cron (vercel.json) every hour.
 * Finds all review requests that:
 *   - Are in SENT or OPENED status
 *   - Were created 20–28 hours ago (reminder window)
 *   - Have NOT already received a reminder
 *
 * Security: requires CRON_SECRET header.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewReminder } from "@/lib/whatsapp";
import { buildReviewUrl } from "@/lib/utils";
import { subHours } from "date-fns";

export async function POST(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = subHours(now, 28); // don't send if too old
  const windowEnd = subHours(now, 20);   // don't send if too recent

  // Find pending review requests in the reminder window
  const pendingRequests = await prisma.reviewRequest.findMany({
    where: {
      status: { in: ["SENT", "OPENED"] },
      createdAt: { gte: windowStart, lte: windowEnd },
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });

  if (pendingRequests.length === 0) {
    return NextResponse.json({ data: { processed: 0, skipped: 0 } });
  }

  // Exclude requests that already have a REVIEW_REMINDER message
  const requestIds = pendingRequests.map((r) => r.id);

  // Check which customers already got a reminder for these requests
  // We use customerId + type + createdAt window to avoid duplicates
  const alreadySent = await prisma.whatsAppMessage.findMany({
    where: {
      customerId: { in: pendingRequests.map((r) => r.customerId) },
      type: "REVIEW_REMINDER",
      createdAt: { gte: windowStart },
    },
    select: { customerId: true },
  });

  const alreadySentSet = new Set(alreadySent.map((m) => m.customerId));

  let processed = 0;
  let skipped = 0;

  for (const request of pendingRequests) {
    if (alreadySentSet.has(request.customerId)) {
      skipped++;
      continue;
    }

    let waStatus: "SENT" | "FAILED" = "SENT";
    let messageId: string | null = null;
    let failureReason: string | undefined;

    try {
      const result = await sendReviewReminder({
        phone: request.customer.phone,
        customerName: request.customer.name,
        businessName: request.tenant.name,
        reviewUrl: buildReviewUrl(request.tenant.slug),
      });
      messageId = result.messageId;
    } catch (err) {
      waStatus = "FAILED";
      failureReason = String(err);
      console.error(`[Reminder Failed] requestId=${request.id}`, err);
    }

    await prisma.whatsAppMessage.create({
      data: {
        tenantId: request.tenantId,
        customerId: request.customerId,
        type: "REVIEW_REMINDER",
        status: waStatus,
        phone: request.customer.phone,
        templateName: "review_reminder_v1",
        provider: process.env.WHATSAPP_PROVIDER ?? "none",
        providerMsgId: messageId,
        sentAt: waStatus === "SENT" ? new Date() : undefined,
        failureReason,
      },
    });

    processed++;
  }

  console.log(`[Cron Reminders] Processed: ${processed}, Skipped: ${skipped}`);

  return NextResponse.json({ data: { processed, skipped } });
}

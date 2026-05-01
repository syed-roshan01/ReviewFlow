import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { subDays, startOfDay, format } from "date-fns";

// ── GET /api/analytics ───────────────────────────────────────────────────────
// Returns summary + 30-day trend data for the authenticated tenant's dashboard
export async function GET(req: Request) {
  try {
    const { tenantUser } = await getAuthContext();
    const tenantId = tenantUser.tenantId;

    const { searchParams } = new URL(req.url);
    const days = Math.min(90, Number(searchParams.get("days") ?? "30"));
    const since = subDays(new Date(), days);

    // ── Summary counts ────────────────────────────────────────────────────────
    const [
      totalRequests,
      redirected,
      negativeFeedback,
      totalCustomers,
      newCustomers,
    ] = await Promise.all([
      prisma.reviewRequest.count({ where: { tenantId } }),
      prisma.reviewRequest.count({
        where: { tenantId, status: { in: ["REDIRECTED", "COMPLETED"] } },
      }),
      prisma.reviewRequest.count({
        where: { tenantId, status: "NEGATIVE_FEEDBACK" },
      }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId, tag: "NEW" } }),
    ]);

    const conversionRate =
      totalRequests > 0
        ? Math.round((redirected / totalRequests) * 100)
        : 0;

    // ── Daily trend (last N days) ─────────────────────────────────────────────
    const dailyRequests = await prisma.reviewRequest.findMany({
      where: { tenantId, createdAt: { gte: since } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const trendMap = new Map<
      string,
      { date: string; sent: number; converted: number; negative: number }
    >();

    for (let i = days - 1; i >= 0; i--) {
      const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
      trendMap.set(dateStr, { date: dateStr, sent: 0, converted: 0, negative: 0 });
    }

    for (const req of dailyRequests) {
      const dateStr = format(req.createdAt, "yyyy-MM-dd");
      const entry = trendMap.get(dateStr);
      if (!entry) continue;
      entry.sent += 1;
      if (req.status === "REDIRECTED" || req.status === "COMPLETED") {
        entry.converted += 1;
      }
      if (req.status === "NEGATIVE_FEEDBACK") {
        entry.negative += 1;
      }
    }

    const trend = Array.from(trendMap.values());

    // ── WhatsApp delivery stats ───────────────────────────────────────────────
    const [waSent, waFailed] = await Promise.all([
      prisma.whatsAppMessage.count({ where: { tenantId, status: "SENT" } }),
      prisma.whatsAppMessage.count({ where: { tenantId, status: "FAILED" } }),
    ]);

    return NextResponse.json({
      data: {
        summary: {
          totalRequests,
          redirected,
          negativeFeedback,
          conversionRate,
          totalCustomers,
          newCustomers,
          whatsapp: { sent: waSent, failed: waFailed },
        },
        trend,
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Analytics Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

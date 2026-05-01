import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";
import { conversionRate } from "@/lib/utils";
import { AnalyticsCharts } from "@/components/analytics/charts";

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const tenantUser = await prisma.tenantUser.findUnique({
    where: { clerkId: userId },
  });
  if (!tenantUser) redirect("/onboarding");

  const tenantId = tenantUser.tenantId;
  const since = subDays(new Date(), 30);

  const [
    totalRequests,
    redirected,
    negativeFeedback,
    opened,
    totalCustomers,
    repeatCustomers,
    dailyRaw,
    recentFeedback,
  ] = await Promise.all([
    prisma.reviewRequest.count({ where: { tenantId } }),
    prisma.reviewRequest.count({
      where: { tenantId, status: { in: ["REDIRECTED", "COMPLETED"] } },
    }),
    prisma.reviewRequest.count({
      where: { tenantId, status: "NEGATIVE_FEEDBACK" },
    }),
    prisma.reviewRequest.count({
      where: { tenantId, status: { not: "SENT" } },
    }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.customer.count({ where: { tenantId, tag: { in: ["REPEAT", "VIP"] } } }),
    prisma.reviewRequest.findMany({
      where: { tenantId, createdAt: { gte: since } },
      select: { createdAt: true, status: true, rating: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.reviewRequest.findMany({
      where: { tenantId, status: "NEGATIVE_FEEDBACK" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        rating: true,
        privateFeedback: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    }),
  ]);

  // Build 30-day trend
  const trendMap = new Map<
    string,
    { date: string; sent: number; converted: number; negative: number }
  >();

  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "MMM d");
    trendMap.set(d, { date: d, sent: 0, converted: 0, negative: 0 });
  }

  for (const r of dailyRaw) {
    const d = format(r.createdAt, "MMM d");
    const entry = trendMap.get(d);
    if (!entry) continue;
    entry.sent++;
    if (r.status === "REDIRECTED" || r.status === "COMPLETED") entry.converted++;
    if (r.status === "NEGATIVE_FEEDBACK") entry.negative++;
  }

  const trend = Array.from(trendMap.values());

  // Rating distribution
  const ratingCounts = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: dailyRaw.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Last 30 days performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: totalRequests, delta: null },
          { label: "Conversion Rate", value: conversionRate(redirected, totalRequests), delta: null },
          { label: "Open Rate", value: conversionRate(opened, totalRequests), delta: null },
          { label: "Repeat Customers", value: conversionRate(repeatCustomers, totalCustomers), delta: null },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {label}
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts — client component */}
      <AnalyticsCharts trend={trend} ratingCounts={ratingCounts} />

      {/* Private Feedback */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Private Feedback ({negativeFeedback} total)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            These customers gave a low rating — only you can see this
          </p>
        </div>
        {recentFeedback.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500 text-center">
            No negative feedback yet — great job!
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentFeedback.map((fb) => (
              <div key={fb.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">
                    {fb.customer.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {"★".repeat(fb.rating ?? 0)}
                      {"☆".repeat(5 - (fb.rating ?? 0))}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(fb.createdAt, "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
                {fb.privateFeedback && (
                  <p className="text-sm text-gray-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                    &quot;{fb.privateFeedback}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

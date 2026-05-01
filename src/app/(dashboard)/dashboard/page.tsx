import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { conversionRate, timeAgo } from "@/lib/utils";
import {
  Send,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Users,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const tenantUser = await prisma.tenantUser.findUnique({
    where: { clerkId: userId },
    include: { tenant: true },
  });
  if (!tenantUser) redirect("/onboarding");

  const tenantId = tenantUser.tenantId;

  // ── Fetch stats ───────────────────────────────────────────────────────────
  const [
    totalRequests,
    redirected,
    negativeFeedback,
    totalCustomers,
    recentRequests,
  ] = await Promise.all([
    prisma.reviewRequest.count({ where: { tenantId } }),
    prisma.reviewRequest.count({
      where: { tenantId, status: { in: ["REDIRECTED", "COMPLETED"] } },
    }),
    prisma.reviewRequest.count({
      where: { tenantId, status: "NEGATIVE_FEEDBACK" },
    }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.reviewRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true, phone: true } } },
    }),
  ]);

  const stats = [
    {
      label: "Requests Sent",
      value: totalRequests,
      icon: Send,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Google Redirects",
      value: redirected,
      icon: ThumbsUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Conversion Rate",
      value: conversionRate(redirected, totalRequests),
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Private Feedback",
      value: negativeFeedback,
      icon: ThumbsDown,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Total Customers",
      value: totalCustomers,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  const statusBadge: Record<string, { label: string; className: string }> = {
    SENT: { label: "Sent", className: "bg-blue-100 text-blue-700" },
    OPENED: { label: "Opened", className: "bg-yellow-100 text-yellow-700" },
    REDIRECTED: { label: "Redirected", className: "bg-green-100 text-green-700" },
    NEGATIVE_FEEDBACK: { label: "Feedback", className: "bg-red-100 text-red-700" },
    COMPLETED: { label: "Done", className: "bg-green-100 text-green-700" },
    EXPIRED: { label: "Expired", className: "bg-gray-100 text-gray-600" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {tenantUser.tenant.name} — here&apos;s what&apos;s happening
          </p>
        </div>
        <Link
          href="/dashboard/customers"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 p-4 space-y-3"
          >
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Recent Review Requests
          </h2>
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No review requests yet.{" "}
            <Link href="/dashboard/customers" className="text-blue-600 underline">
              Add your first customer
            </Link>{" "}
            to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentRequests.map((req) => {
              const badge = statusBadge[req.status];
              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                      {req.customer.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {req.customer.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {req.customer.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {req.rating && (
                      <span className="text-sm font-medium text-gray-700">
                        {"★".repeat(req.rating)}
                        {"☆".repeat(5 - req.rating)}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {timeAgo(req.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/review-link"
          className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <span className="text-xl">📱</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Your Review Link</p>
            <p className="text-xs text-gray-500">Get QR code &amp; share link</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors" />
        </Link>

        <Link
          href="/dashboard/customers"
          className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <span className="text-xl">👥</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Manage Customers</p>
            <p className="text-xs text-gray-500">View &amp; send review requests</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors" />
        </Link>

        <Link
          href="/dashboard/analytics"
          className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Analytics</p>
            <p className="text-xs text-gray-500">View trends &amp; conversion</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
}

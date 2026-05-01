import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export default async function SuperAdminPage() {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) redirect("/dashboard");

  const [tenants, totalCustomers, totalRequests] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { customers: true, reviewRequests: true, users: true },
        },
      },
    }),
    prisma.customer.count(),
    prisma.reviewRequest.count(),
  ]);

  const redirected = await prisma.reviewRequest.count({
    where: { status: { in: ["REDIRECTED", "COMPLETED"] } },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Super Admin Panel
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform-wide overview — all tenants
          </p>
        </div>

        {/* Platform stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Tenants", value: tenants.length },
            { label: "Total Customers", value: totalCustomers },
            { label: "Review Requests", value: totalRequests },
            {
              label: "Platform Conversion",
              value:
                totalRequests > 0
                  ? `${Math.round((redirected / totalRequests) * 100)}%`
                  : "0%",
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* Tenants table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              All Tenants ({tenants.length})
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Business
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Plan
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Customers
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Requests
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Users
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{tenant.name}</p>
                      <p className="text-xs text-gray-400 font-mono">
                        /r/{tenant.slug}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                      {tenant.planId}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    {tenant._count.customers}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    {tenant._count.reviewRequests}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    {tenant._count.users}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tenant.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {tenant.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-xs">
                    {format(tenant.createdAt, "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

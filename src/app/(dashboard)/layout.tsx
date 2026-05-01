import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Star,
  QrCode,
  Settings,
  LogOut,
  Menu,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

const navLinks = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: Star },
  { href: "/dashboard/review-link", label: "Review Link", icon: QrCode },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const tenantUser = await prisma.tenantUser.findUnique({
    where: { clerkId: userId },
    include: { tenant: true },
  });

  if (!tenantUser) redirect("/onboarding");

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">ReviewFlow AI</span>
        </div>

        {/* Business name */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Business
          </p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">
            {tenantUser.tenant.name}
          </p>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 mt-1 capitalize">
            {tenantUser.tenant.planId} plan
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Icon className="w-4 h-4 text-gray-500" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User info + sign out */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
              {(tenantUser.name ?? tenantUser.email)[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {tenantUser.name ?? "Owner"}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {tenantUser.role.toLowerCase()}
              </p>
            </div>
          </div>
          <Link
            href="/sign-out"
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mt-1"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

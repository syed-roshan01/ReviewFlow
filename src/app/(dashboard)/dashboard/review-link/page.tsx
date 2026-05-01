import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildReviewUrl } from "@/lib/utils";
import { QRCodeDisplay } from "@/components/review-link/qr-display";
import { CopyButton } from "@/components/review-link/copy-button";

export default async function ReviewLinkPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const tenantUser = await prisma.tenantUser.findUnique({
    where: { clerkId: userId },
    include: { tenant: true },
  });
  if (!tenantUser) redirect("/onboarding");

  const tenant = tenantUser.tenant;
  const reviewUrl = buildReviewUrl(tenant.slug);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Link & QR Code</h1>
        <p className="text-sm text-gray-500 mt-1">
          Share this link or display the QR code at your business to collect reviews
        </p>
      </div>

      {/* URL display */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Your Review Link</h2>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={reviewUrl}
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono"
          />
          <CopyButton text={reviewUrl} />
        </div>
        <p className="text-xs text-gray-500">
          When customers visit this link, they can rate their experience. High
          ratings redirect to Google; low ratings capture private feedback.
        </p>
      </div>

      {/* QR Code */}
      <QRCodeDisplay url={reviewUrl} businessName={tenant.name} />

      {/* How it works */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
        <h2 className="text-sm font-semibold text-blue-900 mb-3">
          How the Review Funnel Works
        </h2>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="font-bold shrink-0">1.</span>
            Customer scans QR code or clicks WhatsApp link
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">2.</span>
            They select a star rating (1–5)
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">3.</span>
            <span>
              <strong>Rating ≥ 4:</strong> Redirected to your Google Review page
              with AI-suggested review text
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">4.</span>
            <span>
              <strong>Rating ≤ 3:</strong> Private feedback form — you see it,
              Google doesn&apos;t
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}

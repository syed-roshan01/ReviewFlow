import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that are publicly accessible (no auth required)
const isPublicRoute = createRouteMatcher([
  "/",                    // landing page
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/r/(.*)",              // review funnel pages
  "/api/public/(.*)",     // public API endpoints
  "/api/cron/(.*)",       // cron jobs (secured by CRON_SECRET, not Clerk)
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

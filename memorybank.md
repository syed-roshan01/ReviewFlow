# ReviewFlow AI — Memory Bank

> Complete project reference. Last updated: May 2, 2026.

---

## 1. Project Overview

**What it is:** Multi-tenant SaaS platform for local businesses to grow Google reviews via WhatsApp automation.

- **Live URL:** https://review-flow-l5yo.vercel.app
- **Repo root:** `ReviewFlow AI/`

### Core User Flow
1. Business owner signs up → Clerk auth → `/onboarding` → sets up business profile
2. Staff adds customers via dashboard → optionally sends WhatsApp review request
3. Customer receives WhatsApp → clicks link → `/r/[slug]?r=[requestId]` (review funnel)
4. Funnel: star rating → if **≥ 4 stars** → redirect to Google + show AI review suggestions; if **≤ 3 stars** → private feedback form
5. Cron job sends a 24h reminder WhatsApp if no response

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2.5 (App Router) |
| Language | TypeScript 5 |
| Auth | Clerk (`@clerk/nextjs` v5) |
| Database | PostgreSQL via Neon |
| ORM | Prisma v5 |
| Styling | Tailwind CSS 3 + Radix UI primitives |
| Charts | Recharts |
| AI | OpenAI v4 (review suggestion drafts) |
| WhatsApp | Abstracted provider (WATI / Twilio / NoOp) |
| Validation | Zod |
| Date utils | date-fns |
| QR codes | qrcode package |
| Deployment | Vercel (with Vercel Cron) |

### Key Scripts
```bash
npm run dev          # start dev server
npm run build        # prisma generate && next build
npm run db:push      # push schema to DB (no migration file)
npm run db:migrate   # prisma migrate dev
npm run db:studio    # Prisma Studio GUI
npm run db:seed      # run prisma/seed.ts
npm run typecheck    # tsc --noEmit
```

---

## 2. Architecture & Patterns

### Multi-Tenant Design
- **Strategy:** Shared database, row-level isolation via `tenantId` on every table
- **Golden rule:** NEVER accept `tenantId` from a request body — always derive from session
- **Auth chain:** Clerk `userId` → `TenantUser.clerkId` → `TenantUser.tenantId`
- All DB queries MUST filter by `tenantId`

```
Tenant 1 (Restaurant A)        Tenant 2 (Salon B)
  └── customers (tenantId=A)     └── customers (tenantId=B)
  └── review_requests            └── review_requests
  └── whatsapp_messages          └── whatsapp_messages
```

### Middleware (`src/middleware.ts`)
Uses `clerkMiddleware`. Public routes (no auth required):
- `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/onboarding(.*)`, `/r/(.*)`
- `/api/public/(.*)` — public API
- `/api/cron/(.*)` — secured by `CRON_SECRET`, not Clerk

All other routes require Clerk auth. Unauthenticated → redirect to `/sign-in?redirect_url=...`

### Auth Helpers (`src/lib/auth.ts`)
| Function | Purpose |
|----------|---------|
| `getAuthContext()` | Returns `{ clerkId, tenantUser: TenantUser & { tenant } }`. Throws `"UNAUTHORIZED"` / `"TENANT_NOT_FOUND"` / `"TENANT_INACTIVE"` |
| `isSuperAdmin()` | Checks Clerk userId against `SUPER_ADMIN_IDS` env var (comma-separated) |
| `provisionTenantUser(tenantId, role)` | Creates TenantUser after Clerk sign-up |

### Tenant Helpers (`src/lib/tenant.ts`)
| Function | Purpose |
|----------|---------|
| `getTenantBySlug(slug)` | For public review funnel |
| `getTenantById(id)` | For dashboard |
| `assertTenantAccess(tenantId, clerkId)` | Cross-tenant guard — throws `"FORBIDDEN"` |

### Utility Functions (`src/lib/utils.ts`)
| Function | Purpose |
|----------|---------|
| `cn(...inputs)` | clsx + tailwind-merge class merger |
| `formatPhone(phone)` | E.164 → display format (e.g. `+1 (555) 555-0101`) |
| `slugify(name)` | `"Demo Restaurant"` → `"demo-restaurant"` |
| `conversionRate(completed, total)` | Returns percentage string |
| `timeAgo(date)` | Relative time: "2d ago", "just now" |
| `buildReviewUrl(slug)` | `${NEXT_PUBLIC_APP_URL}/r/${slug}` |
| `getReviewSuggestions(businessName, rating)` | Fallback review templates (used when OpenAI unavailable) |

### WhatsApp Abstraction Layer (`src/lib/whatsapp/index.ts`)
- **Interface:** `WhatsAppProvider` with `sendTemplate(to, templateName, variables[])`
- **Factory:** `getWhatsAppProvider()` reads `WHATSAPP_PROVIDER` env → returns WATI / Twilio / NoOp
- **Business helpers:** `sendReviewRequest(payload)`, `sendReviewReminder(payload)`
- **Template names:** `review_request_v1`, `review_reminder_v1`, `thank_you_v1`
- Set `WHATSAPP_PROVIDER=none` to disable (current default)

### Standard Error Handling Pattern in API Routes
```ts
} catch (err) {
  if (err instanceof z.ZodError) return NextResponse.json({ error: "Validation error", issues: err.issues }, { status: 422 });
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.message === "FORBIDDEN")    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

---

## 3. Database Schema

### `tenants`
```
id              String   @id cuid
name            String
slug            String   @unique  ← /r/[slug] funnel URL
googleReviewUrl String
phone           String?
email           String?
logoUrl         String?
address         String?
aiContext       String?           ← business context for AI suggestions
planId          String   default "free"   (free | growth | pro)
isActive        Boolean  default true
createdAt       DateTime
updatedAt       DateTime @updatedAt
```

### `tenant_users`
```
id        String @id
tenantId  String → tenants (cascade delete)
clerkId   String @unique
email     String
name      String?
role      Role   default STAFF   (OWNER | ADMIN | STAFF)
```

### `customers`
```
id          String @id
tenantId    String → tenants
name        String
phone       String   ← E.164 format: +1234567890
email       String?
tag         CustomerTag default NEW  (NEW | REPEAT | VIP | AT_RISK)
visitCount  Int     default 1
notes       String?
lastVisitAt DateTime
@@unique([tenantId, phone])  ← upsert key
```

### `review_requests`
```
id              String @id
tenantId        String
customerId      String → customers
status          ReviewRequestStatus default SENT
rating          Int?   (1–5, set when customer rates)
privateFeedback String?  (only captured for ratings ≤ 3)
redirectedAt    DateTime?
completedAt     DateTime?
```

**`ReviewRequestStatus`:** `SENT → OPENED → REDIRECTED` (≥4★) or `NEGATIVE_FEEDBACK` (≤3★) or `COMPLETED` / `EXPIRED`

### `whatsapp_messages`
```
id            String @id
tenantId      String
customerId    String
type          MessageType  (REVIEW_REQUEST | REVIEW_REMINDER | THANK_YOU)
status        MessageStatus default QUEUED  (QUEUED | SENT | DELIVERED | READ | FAILED)
phone         String   ← snapshot at send time
templateName  String?
provider      String   default "wati"
providerMsgId String?
metadata      Json?
sentAt        DateTime?
deliveredAt   DateTime?
failureReason String?
```

### Key DB Rules
- All tables have `@@index([tenantId])`
- `ReviewRequest` also indexed on `customerId`, `createdAt`
- `Customer` has `@@unique([tenantId, phone])`

---

## 4. API Routes

### Authenticated Routes (Clerk session required)

#### Customers
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/customers` | Paginated. Params: `page`, `limit` (max 100), `search`, `tag` |
| POST | `/api/customers` | Upsert by phone. Body: `name, phone (E.164), email?, notes?, sendReviewRequest?` |
| GET | `/api/customers/[id]` | Single customer + review history |
| PATCH | `/api/customers/[id]` | Update tag/details |
| DELETE | `/api/customers/[id]` | Delete customer |

POST upsert logic: existing phone → increment `visitCount`, set `tag=REPEAT`, update `lastVisitAt`; new phone → create with `tag=NEW`

#### Review Requests
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/review-requests` | List all requests |
| POST | `/api/review-requests` | Create + send WhatsApp |
| PATCH | `/api/review-requests/[id]` | Update status/rating |

#### Analytics
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/analytics` | Params: `days` (max 90, default 30) |

Response shape:
```json
{
  "data": {
    "summary": {
      "totalRequests": 0,
      "redirected": 0,
      "negativeFeedback": 0,
      "conversionRate": 0,
      "totalCustomers": 0,
      "newCustomers": 0,
      "whatsapp": { "sent": 0, "failed": 0 }
    },
    "trend": [{ "date": "yyyy-MM-dd", "sent": 0, "converted": 0, "negative": 0 }]
  }
}
```

#### Tenant Settings
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/tenants/me` | Full tenant profile + users list |
| PATCH | `/api/tenants/me` | OWNER or ADMIN only. Fields: `name, googleReviewUrl, phone, email, logoUrl, address, aiContext` |

#### Onboarding
| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/onboarding` | One-time. Creates Tenant + TenantUser in `$transaction`. Returns 409 if already onboarded. |

Body: `businessName (min 2), googleReviewUrl (URL), phone? (E.164), email?, address?`  
Slug: `slugify(businessName)` + collision appends `-${Date.now().toString(36)}`

### Public Routes (no auth)
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/public/tenant/[slug]` | Tenant info for review funnel |
| PATCH | `/api/public/review?id=[requestId]` | Mark review as OPENED (called on funnel page load) |
| POST | `/api/public/review` | Submit rating/feedback. Body: `requestId (cuid), rating (1-5), privateFeedback?` |
| POST | `/api/public/ai-suggestions` | Generate 3 review drafts. Body: `businessName, rating (4-5), address?, aiContext?` |

AI Suggestions safeguards:
- In-memory cache: 6h TTL, keyed by `{businessName}-{rating}`
- Per-IP rate limit: 3 OpenAI calls/hour (silent fallback on exceed)
- Daily budget cap: 180 OpenAI calls/day (resets midnight UTC)
- Any limit/error → silent fallback to `getReviewSuggestions()` templates — funnel never breaks

### Cron Route (`CRON_SECRET` bearer auth)
| Method | Route | Schedule |
|--------|-------|----------|
| POST | `/api/cron/reminders` | `0 9 * * *` (daily 9am UTC) |

Header required: `Authorization: Bearer ${CRON_SECRET}`  
Logic: finds `SENT` or `OPENED` requests created 20–28 hours ago, skips customers who already got a reminder, sends `review_reminder_v1` WhatsApp.

---

## 5. Frontend Pages & Components

### File Structure
```
src/app/
  page.tsx                          ← Landing page (SSG)
  layout.tsx                        ← Root layout
  globals.css
  (dashboard)/
    layout.tsx                      ← Sidebar + auth guard
    dashboard/
      page.tsx                      ← Overview stats + recent activity
      analytics/page.tsx            ← Charts + private feedback
      customers/page.tsx            ← Customer list + add
      review-link/page.tsx          ← QR code + copy URL
      settings/
        page.tsx                    ← Server wrapper
        settings-client.tsx         ← Client form component
  admin/page.tsx                    ← Super admin panel
  onboarding/page.tsx               ← Business setup form (client)
  r/[slug]/page.tsx                 ← Review funnel (client)
  sign-in/[[...sign-in]]/page.tsx
  sign-up/[[...sign-up]]/page.tsx
  api/...                           ← Route handlers
```

### Dashboard Layout (`(dashboard)/layout.tsx`)
- Server component; auth guards via Clerk `auth()`
- Redirects: not authenticated → `/sign-in`; no TenantUser → `/onboarding`
- Sidebar: logo, business name + plan badge, nav links, user info + sign out
- Nav: Overview, Customers, Analytics, Review Link, Settings

### Review Funnel Stages (`/r/[slug]`)
```
loading → rating → google-redirect (≥4★) → [AI suggestions shown]
                → feedback (≤3★) → thank-you
        → error (tenant not found)
```
- URL: `/r/[slug]?r=[requestId]`
- On load: GET `/api/public/tenant/[slug]`, PATCH `/api/public/review?id=...` (mark OPENED)
- On ≥4★: POST review, fetch AI suggestions in parallel (non-blocking), open Google URL
- On ≤3★: collect text feedback, POST with `privateFeedback`
- AI suggestions have copy-to-clipboard + "paste hint" UX

### Settings Page AI Context
`settings-client.tsx` has a "Use Template" button that pre-fills `aiContext` with a comprehensive business profile template covering: name, type, location, specialties, unique selling points, atmosphere, team info, and local SEO keywords.

### Components
| File | Purpose |
|------|---------|
| `src/components/analytics/charts.tsx` | Recharts components for analytics dashboard |
| `src/components/review-link/copy-button.tsx` | Clipboard copy button with visual feedback |
| `src/components/review-link/qr-display.tsx` | QR code generation and display |

### UI Primitives Used
Radix UI: `Dialog`, `DropdownMenu`, `Label`, `Select`, `Separator`, `Slot`, `Tabs`, `Toast`, `Tooltip`  
Icons: Lucide React  
Styling helper: `cn()` from `src/lib/utils.ts`

---

## 6. Environment Variables

```env
# Database
DATABASE_URL="postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require"

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"

# App
NEXT_PUBLIC_APP_URL="https://review-flow-l5yo.vercel.app"

# WhatsApp Provider (none | wati | twilio)
WHATSAPP_PROVIDER="none"

# OpenAI
OPENAI_API_KEY="sk-proj-..."

# Cron Security
CRON_SECRET="change-me-to-a-random-string"

# Super Admin (comma-separated Clerk user IDs)
SUPER_ADMIN_IDS="user_3D8t7WFlKv4MHApbu9ptpDeEwSR"
```

---

## 7. WhatsApp Templates

Register these in your WhatsApp Business account before switching `WHATSAPP_PROVIDER` to `wati` or `twilio`:

```
review_request_v1:
  "Hi {{1}}! Thanks for visiting {{2}}.
   We'd love to hear about your experience.
   Please take 30 seconds: {{3}}"

review_reminder_v1:
  "Hi {{1}}, just a quick reminder from {{2}}.
   Your feedback means a lot to us!
   Rate your visit here: {{3}}"

thank_you_v1:
  "Thank you {{1}} for your review!
   We appreciate your support of {{2}}."

Variables order: [customerName, businessName, reviewUrl]
```

---

## 8. Deployment & Cron

**Platform:** Vercel

**`vercel.json`:**
```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "0 9 * * *" }
  ]
}
```
Runs daily at 9:00am UTC.

---

## 9. Business Logic Notes

- **Tenant isolation:** `tenantId` is always derived server-side from the Clerk session — never trusted from the client
- **Customer upsert key:** `(tenantId, phone)` — adding the same phone number increments `visitCount` and sets `tag=REPEAT`
- **Review funnel idempotency:** already-processed requests (REDIRECTED / NEGATIVE_FEEDBACK / COMPLETED) return the cached result without re-processing
- **Slug collision:** if a slug already exists during onboarding, suffix `-${Date.now().toString(36)}` is appended
- **Plan system:** `planId` field exists (free / growth / pro) but no billing is implemented yet — it's just a label
- **Super admin:** controlled via `SUPER_ADMIN_IDS` env var; checked on every `/admin` page request via `isSuperAdmin()`
- **AI fallback:** all AI suggestion failures degrade silently — funnel always completes even with no OpenAI key

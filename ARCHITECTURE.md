# ReviewFlow AI — Architecture & Development Guide

> Multi-tenant SaaS platform for local businesses to grow Google reviews via WhatsApp automation.

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│                                                                      │
│  ┌─────────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│  │  Landing Page   │  │  Dashboard (auth) │  │  Review Funnel   │  │
│  │  /              │  │  /dashboard/*     │  │  /r/[slug]       │  │
│  │  Next.js SSG    │  │  Next.js SSR      │  │  Next.js CSR     │  │
│  └─────────────────┘  └────────┬──────────┘  └────────┬─────────┘  │
└───────────────────────────────-┼────────────────────-─┼────────────┘
                                 │                       │
┌────────────────────────────────▼───────────────────────▼────────────┐
│                          API LAYER (Next.js Route Handlers)          │
│                                                                      │
│  Authenticated          Public               Cron                   │
│  /api/customers         /api/public/tenant   /api/cron/reminders    │
│  /api/review-requests   /api/public/review   (Vercel Cron, 1/hr)    │
│  /api/analytics         /api/onboarding                             │
│  /api/tenants/me                                                     │
└────────────────┬───────────────────────────────────────┬────────────┘
                 │                                       │
┌────────────────▼────────────┐   ┌────────────────────▼─────────────┐
│       DATABASE LAYER        │   │       WHATSAPP PROVIDER LAYER    │
│                             │   │                                  │
│  PostgreSQL (Supabase/Neon) │   │  Interface: WhatsAppProvider     │
│  Prisma ORM                 │   │  ┌─────────┐  ┌────────────────┐ │
│                             │   │  │  WATI   │  │  Twilio        │ │
│  Multi-tenant isolation:    │   │  │(default)│  │  (alternative) │ │
│  tenantId on every table    │   │  └─────────┘  └────────────────┘ │
└─────────────────────────────┘   └──────────────────────────────────┘
                 │
┌────────────────▼────────────┐
│         AUTH LAYER          │
│                             │
│  Clerk (NextJS SDK)         │
│  - Sign in/up pages         │
│  - Session management       │
│  - Middleware protection    │
└─────────────────────────────┘
```

---

## 2. Multi-Tenant Design

**Strategy:** Shared database, tenant isolation via `tenantId` foreign key.

**Why not separate schemas/databases?**
- MVP doesn't need the added complexity
- Prisma middleware can enforce row-level isolation
- Supabase RLS can be added as a safety net later

**Isolation rules:**
1. Every API route reads `tenantId` from the authenticated user's `TenantUser` record
2. **Never** accept `tenantId` from the request body — always derive it from session
3. All DB queries filter by `tenantId` — the Prisma layer enforces this

```
Tenant 1 (Restaurant A)        Tenant 2 (Salon B)
  └── customers (tenantId=A)     └── customers (tenantId=B)
  └── review_requests            └── review_requests
  └── whatsapp_messages          └── whatsapp_messages
```

---

## 3. Database Schema

```
tenants
  id, name, slug (unique), googleReviewUrl, phone, email, 
  logoUrl, address, planId, isActive, createdAt, updatedAt

tenant_users
  id, tenantId→tenants, clerkId (unique), email, name,
  role (OWNER|ADMIN|STAFF), createdAt, updatedAt

customers
  id, tenantId→tenants, name, phone (E.164), email?,
  tag (NEW|REPEAT|VIP|AT_RISK), visitCount, notes?,
  lastVisitAt, createdAt, updatedAt
  UNIQUE: (tenantId, phone)

review_requests
  id, tenantId→tenants, customerId→customers,
  status (SENT|OPENED|REDIRECTED|NEGATIVE_FEEDBACK|COMPLETED|EXPIRED),
  rating (1-5)?, privateFeedback?, redirectedAt?, completedAt?,
  createdAt, updatedAt

whatsapp_messages
  id, tenantId→tenants, customerId→customers,
  type (REVIEW_REQUEST|REVIEW_REMINDER|THANK_YOU),
  status (QUEUED|SENT|DELIVERED|READ|FAILED),
  phone, templateName?, provider, providerMsgId?,
  metadata (JSON)?, sentAt?, deliveredAt?, failureReason?,
  createdAt
```

---

## 4. API Structure

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/customers` | ✅ | List customers (paginated, searchable) |
| POST | `/api/customers` | ✅ | Add/upsert customer + optional WA send |
| GET | `/api/customers/[id]` | ✅ | Get customer + history |
| PATCH | `/api/customers/[id]` | ✅ | Update customer tag/details |
| DELETE | `/api/customers/[id]` | ✅ | Delete customer |
| GET | `/api/review-requests` | ✅ | List review requests |
| POST | `/api/review-requests` | ✅ | Create request + send WhatsApp |
| PATCH | `/api/review-requests/[id]` | ✅ | Update status/rating |
| GET | `/api/analytics` | ✅ | Summary + 30-day trend |
| GET | `/api/tenants/me` | ✅ | Get tenant profile |
| PATCH | `/api/tenants/me` | ✅ | Update tenant settings |
| POST | `/api/onboarding` | ✅ Clerk | Create tenant + user after sign-up |
| GET | `/api/public/tenant/[slug]` | ❌ | Funnel: get tenant info |
| POST | `/api/public/review` | ❌ | Funnel: submit rating/feedback |
| PATCH | `/api/public/review` | ❌ | Funnel: mark as opened |
| POST | `/api/cron/reminders` | 🔑 Secret | Send 24h WhatsApp reminders |

---

## 5. Frontend Pages

```
Public routes (no auth):
  /                    Landing page
  /sign-in             Clerk sign-in
  /sign-up             Clerk sign-up
  /onboarding          Business setup form (post sign-up)
  /r/[slug]            Review funnel (star rating → Google or feedback)

Dashboard routes (Clerk auth required):
  /dashboard           Overview + stats + recent activity
  /dashboard/customers Customer list + add/search + send WA
  /dashboard/analytics 30-day charts + private feedback list
  /dashboard/review-link QR code + copyable review URL
  /dashboard/settings  Business profile + Google URL

Admin routes:
  /admin               Super admin: all tenants + platform stats
```

---

## 6. Review Funnel Flow

```
Customer receives WhatsApp → clicks link → /r/[slug]?r=[requestId]

Page loads → PATCH /api/public/review?id=[requestId]  (marks OPENED)

Customer selects star rating:

  ≥ 4 stars                        ≤ 3 stars
  │                                 │
  ▼                                 ▼
POST /api/public/review         POST /api/public/review
  { rating: 5,                    { rating: 2,
    requestId: "..." }              feedback: "...",
  ▼                                 requestId: "..." }
Redirect to Google              ▼
Review URL                    "Thank you" screen
+ Show AI review              (private feedback stored,
  suggestions                  NOT sent to Google)
```

---

## 7. WhatsApp Automation

**Templates required (register in your WhatsApp Business account):**

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
```

**Provider switching:** Set `WHATSAPP_PROVIDER=wati|twilio|none` in `.env.local`

**24h reminder cron:** Runs hourly via Vercel Cron → finds SENT/OPENED requests in the 20-28h window → sends reminder → logs result.

---

## 8. Folder Structure

```
reviewflow-ai/
├── prisma/
│   ├── schema.prisma          # Full DB schema
│   └── seed.ts                # Demo data seeder
│
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Route group — protected layout
│   │   │   ├── layout.tsx     # Sidebar + auth check
│   │   │   ├── dashboard/     # Overview page
│   │   │   ├── customers/     # Customer list + add modal
│   │   │   ├── analytics/     # Charts + feedback
│   │   │   ├── review-link/   # QR code + share link
│   │   │   └── settings/      # Business settings
│   │   ├── admin/             # Super admin panel
│   │   ├── onboarding/        # Post sign-up setup
│   │   ├── r/[slug]/          # Public review funnel
│   │   ├── api/
│   │   │   ├── customers/     # CRUD + upsert
│   │   │   ├── review-requests/ # Create + update
│   │   │   ├── analytics/     # Aggregated stats
│   │   │   ├── tenants/me/    # Tenant profile
│   │   │   ├── onboarding/    # Tenant + user creation
│   │   │   ├── public/        # Unauthenticated endpoints
│   │   │   │   ├── tenant/[slug]/
│   │   │   │   └── review/
│   │   │   └── cron/
│   │   │       └── reminders/ # 24h WhatsApp reminders
│   │   ├── layout.tsx         # Root layout + ClerkProvider
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Tailwind + CSS variables
│   │
│   ├── components/
│   │   ├── analytics/
│   │   │   └── charts.tsx     # Recharts (client component)
│   │   └── review-link/
│   │       └── qr-display.tsx # QR code generator (client)
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Singleton PrismaClient
│   │   ├── auth.ts            # getAuthContext, isSuperAdmin
│   │   ├── tenant.ts          # getTenantBySlug, assertTenantAccess
│   │   ├── utils.ts           # cn, slugify, timeAgo, review suggestions
│   │   └── whatsapp/
│   │       └── index.ts       # Provider interface + WATI + Twilio + NoOp
│   │
│   └── middleware.ts          # Clerk auth middleware + public routes
│
├── .env.example               # All required env vars documented
├── .gitignore
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                # Cron job config
└── ARCHITECTURE.md            # This file
```

---

## 9. Tech Stack Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **Framework** | Next.js 14 (App Router) | Full-stack, SSR/SSG, API routes in one repo. Ideal for SaaS. |
| **Auth** | Clerk | Fastest setup, built-in UI, session management, webhook support. No auth bugs to debug. |
| **Database** | PostgreSQL + Prisma | Type-safe, migrations, great multi-tenant support. Prisma generates the client automatically. |
| **DB Host** | Supabase / Neon | Both offer serverless Postgres, free tier, connection pooling. Neon is better for Vercel cold starts. |
| **Styling** | Tailwind CSS | Utility-first, no runtime overhead, fast iteration. |
| **Charts** | Recharts | Lightweight, React-native, no heavy setup. |
| **WhatsApp** | WATI (default) | Best DX for template-based WA. Abstracted so you can swap to Twilio or Meta Cloud API. |
| **Cron** | Vercel Cron | Zero infrastructure. Fires hourly. Secured with CRON_SECRET. |
| **QR Code** | `qrcode` npm | Canvas-based, downloadable PNG, no server needed. |
| **Deployment** | Vercel | Zero config, Next.js native, preview deployments, built-in cron. |

---

## 10. Key Tradeoffs

| Tradeoff | Decision | Alternative |
|----------|----------|-------------|
| Shared DB vs per-tenant DB | Shared (tenant isolation via tenantId) | Per-tenant DB: more isolated but 10x infra complexity |
| REST vs tRPC | REST (Next.js Route Handlers) | tRPC: better type-safety but more setup time for MVP |
| AI reviews | Template-based strings | OpenAI API: better but $0.002/req adds up; add post-MVP |
| WhatsApp delivery receipt | Logged but async | Webhook-based: needs public URL, adds complexity |
| Analytics | Computed on-demand | Pre-aggregated jobs: needed only at scale (>10k req/day) |

---

## 11. Step-by-Step Development Plan (10 Days)

### Day 1 — Foundation
- [ ] Clone repo, install deps: `npm install`
- [ ] Set up Supabase/Neon project, get `DATABASE_URL`
- [ ] Set up Clerk project, get keys
- [ ] Copy `.env.example` → `.env.local`, fill in all values
- [ ] Run `npm run db:push` to create tables
- [ ] Run `npm run dev` — verify it starts

### Day 2 — Auth & Onboarding
- [ ] Test Clerk sign-up → `/onboarding` → creates tenant in DB
- [ ] Verify `tenant_users` row is created with correct `clerkId`
- [ ] Test redirect to `/dashboard` after onboarding
- [ ] Test protected routes redirect to sign-in when logged out

### Day 3 — Customer Management
- [ ] Test `POST /api/customers` — add a customer
- [ ] Test `GET /api/customers` — list with search/pagination
- [ ] Verify upsert logic: adding same phone increments `visitCount`
- [ ] Test dashboard customers page end-to-end

### Day 4 — Review Requests
- [ ] Test `POST /api/review-requests` with `WHATSAPP_PROVIDER=none`
- [ ] Verify WhatsApp message logged in DB with `status=SENT`
- [ ] Open `/r/[slug]` — confirm page loads with correct business name
- [ ] Submit 5-star rating → verify `status=REDIRECTED` in DB
- [ ] Submit 2-star rating + feedback → verify `status=NEGATIVE_FEEDBACK`

### Day 5 — WhatsApp Integration
- [ ] Sign up for WATI trial at app.wati.io
- [ ] Create and submit WhatsApp templates for approval (takes 24–48h)
- [ ] Set `WHATSAPP_PROVIDER=wati`, add WATI credentials
- [ ] Test real WhatsApp send to your own number
- [ ] Verify `providerMsgId` is stored in DB

### Day 6 — Analytics & QR Code
- [ ] Test analytics page — verify all stat cards show correct numbers
- [ ] Verify 30-day trend chart renders with data
- [ ] Test private feedback list with real negative submissions
- [ ] Test QR code generation and download
- [ ] Test copy-to-clipboard on review link

### Day 7 — Cron & Reminders
- [ ] Deploy to Vercel staging
- [ ] Verify Vercel Cron triggers `/api/cron/reminders`
- [ ] Test reminder: create a review request, wait (or manually call cron)
- [ ] Verify reminder not sent twice (idempotency check)
- [ ] Check `CRON_SECRET` rejects unauthorized calls

### Day 8 — Settings & Admin
- [ ] Test settings form — update business name, Google URL
- [ ] Verify changes reflect on review funnel immediately
- [ ] Add your Clerk user ID to `SUPER_ADMIN_IDS`
- [ ] Test `/admin` — should show all tenants

### Day 9 — Polish & Testing
- [ ] Mobile test review funnel page (primary use case is mobile!)
- [ ] Test full flow on real device: WhatsApp → link → rating → Google
- [ ] Add error boundaries for chart components
- [ ] Test with empty states (new tenant with no data)
- [ ] Verify tenant isolation: two tenants cannot see each other's data

### Day 10 — Launch Prep
- [ ] Set up custom domain on Vercel
- [ ] Configure Vercel environment variables (production values)
- [ ] Run `npm run db:push` on production DB
- [ ] Set up Supabase database backups
- [ ] Set up basic uptime monitoring (Better Uptime or UptimeRobot)
- [ ] Record a 2-min Loom demo video
- [ ] Launch! 🚀

---

## 12. Environment Variables Reference

See `.env.example` for the full list with descriptions.

**Required to start:**
- `DATABASE_URL` — PostgreSQL connection string (use [neon.tech](https://neon.tech) — free, serverless, best Vercel integration)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk public key
- `CLERK_SECRET_KEY` — Clerk secret key
- `NEXT_PUBLIC_APP_URL` — Your app URL (for QR/review links)
- `CRON_SECRET` — Random string to secure cron endpoint
- `OPENAI_API_KEY` — For AI review generation ([platform.openai.com](https://platform.openai.com))

**Required for WhatsApp:**
- `WHATSAPP_PROVIDER=wati` (or `twilio` or `none` for dev)
- `WATI_API_URL` + `WATI_API_TOKEN` (if using WATI)

---

## 13. Post-MVP Roadmap

The codebase is designed to extend cleanly:

| Feature | How to Add |
|---------|-----------|
| AI review text | Replace `getReviewSuggestions()` in `utils.ts` with OpenAI API call |
| Email notifications | Add SendGrid/Resend in a new `src/lib/email/` module |
| Review-to-content | New dashboard page + OpenAI prompt on high-rated reviews |
| Billing/subscriptions | Add Stripe via Clerk's billing or Stripe SDK; check `planId` |
| Competitor tracking | New Google Places API integration + `competitor_snapshots` table |
| Advanced WhatsApp flows | Upgrade WhatsApp provider to Meta Cloud API with webhook handler |
| SMS fallback | Add Twilio SMS provider alongside WhatsApp |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in all values in .env.local

# 3. Push database schema
npm run db:push

# 4. (Optional) Seed demo data
npm run db:seed

# 5. Start development server
npm run dev

# 6. Open http://localhost:3000
```

# Current Architecture — weeds.dk
**Last updated:** 2026-07-31

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js (App Router) | Vercel deployment, auto-deploys from `main` |
| Database | Supabase (PostgreSQL) | Direct `pg` connection via `DATABASE_URL` |
| Auth (admin) | Env-var secret (`ADMIN_SECRET`) | Cookie-based session, 8h expiry |
| Payments | QuickPay / Mollie adapters | DB-driven gateway selection |
| Attribution | HTTP-only cookies via `src/proxy.ts` | gclid, utm_*, click_id, affiliate_id |
| AI Pipeline | Gemini (Harvester → Scout → Editor) | Writes to `raw_content_inbox` → `draft_articles` |

---

## Rendering Strategy

| Route | Strategy | Reason |
|---|---|---|
| `/journal`, `/journal/[slug]` | `force-dynamic` | CMS edits must appear immediately without redeploy |
| `/admin/*` | `force-dynamic` | Always fresh DB state |
| `/` (homepage) | Static + ISR | Marketing content, rarely changes |
| `/shop` | `force-dynamic` | Geo-filtered by country compliance |

**Why not ISR for journal?** ISR would work (`revalidate = 60`) but adds cache complexity. At current traffic levels, direct DB reads on every request are acceptable and simpler to reason about.

---

## Route Map

```
/
├── (public)
│   ├── page.tsx                  # Homepage — fetches 3 latest published articles
│   ├── journal/
│   │   ├── page.tsx              # Lists all published journal_articles
│   │   └── [slug]/page.tsx       # Single published article (force-dynamic)
│   └── shop/page.tsx             # Product catalog (geo-filtered)
│
├── admin/
│   ├── layout.tsx                # Auth guard — checks ADMIN_SECRET cookie
│   ├── page.tsx                  # Dashboard with stats + nav
│   ├── articles/
│   │   ├── page.tsx              # List all journal_articles
│   │   └── [id]/page.tsx         # Edit single journal_article
│   ├── drafts/
│   │   └── page.tsx              # draft_articles table (ArticleTable component)
│   └── inbox/
│       ├── page.tsx              # List raw_content_inbox items
│       └── [id]/page.tsx         # Edit single raw signal
│
└── api/
    ├── admin/
    │   ├── login/route.ts        # POST — sets admin cookie
    │   ├── logout/route.ts       # POST — deletes admin cookie
    │   ├── articles/[id]/route.ts # PATCH — update journal_article
    │   └── inbox/[id]/route.ts   # PATCH — update raw_content_inbox item
    ├── drafts/route.ts           # GET/PATCH/DELETE draft_articles
    ├── pipeline/run/route.ts     # POST — trigger AI content pipeline
    ├── checkout/route.ts         # POST — create payment via gateway adapter
    └── webhooks/payment/route.ts # POST — handle payment gateway webhooks
```

---

## Content Flow

```
External source (PubMed, news, EMA)
        │
        ▼
raw_content_inbox          ← Harvester agent writes here
        │  (status: pending → scored → ignored | ready_for_draft)
        ▼
draft_articles             ← Promoted by pipeline or manually by editor
        │  (review_status: pending_review → approved | rejected | published)
        ▼
journal_articles           ← Copied on publish (upsert on slug)
        │  (status: draft | review | published | archived)
        ▼
/journal public pages      ← force-dynamic, reads status='published' only
```

---

## Auth Model

**Admin CMS** (`/admin/*`):
- No user accounts — single shared `ADMIN_SECRET` env var
- Cookie: `weeds_admin_token`, HTTP-only, 8h expiry
- Set via `POST /api/admin/login`, cleared via `POST /api/admin/logout`
- Guard lives in `src/app/admin/layout.tsx` — all admin routes are protected

**Public site:** No auth required. All public reads filtered by `status = 'published'`.

**Supabase RLS:** Enabled on all tables via `migration_v1.8.sql`. Protects the Supabase REST API layer only — the app bypasses RLS by connecting directly via `pg` with the service role connection string.

---

## Database Access

All DB queries go through `src/lib/db.ts` → `query()` → `pg.Pool`.

- Connection string: `DATABASE_URL` env var
- SSL enabled in production (`rejectUnauthorized: false`)
- No ORM — raw SQL throughout
- No Supabase JS client used — direct PostgreSQL

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ADMIN_SECRET` | Yes | Admin CMS login password |
| `GEMINI_API_KEY` | Pipeline only | Google Gemini API for content agents |
| `QUICKPAY_API_KEY` | Payments | QuickPay gateway |
| `QUICKPAY_PRIVATE_KEY` | Payments | QuickPay webhook verification |
| `MOLLIE_API_KEY` | Payments | Mollie gateway |

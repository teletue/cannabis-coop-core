# Database — Current State
**Generated:** 2026-07-29 · **Source:** `database_schema.sql`, `migration_v1.3.sql`, `migration_v1.5.sql`, `migration_v1.6.sql`

---

## Table Summary

| Table | Purpose | Access Level | RLS Status |
|---|---|---|---|
| `journal_articles` | Public-facing published articles | **Public (read)** | ❌ Disabled |
| `draft_articles` | Pipeline staging area for articles under review | **Admin-only** | ❌ Disabled |
| `raw_content_inbox` | Raw harvested signals from PubMed/web | **Admin-only** | ❌ Disabled |
| `products` | Product catalog (CBD/hemp items) | **Public (read)** | ❌ Disabled |
| `members` | Cooperative membership records | **Private** | ❌ Disabled |
| `member_shares` | Points ledger per member per year | **Private** | ❌ Disabled |
| `transactions` | Payment/order history | **Private** | ❌ Disabled |
| `payment_gateways` | Gateway routing config | **Private** | ❌ Disabled |
| `country_compliance` | Geo-compliance rules per country | **Public (read)** | ❌ Disabled |
| `democratic_certificates` | Governance proof documents | **Private** | ❌ Disabled |

---

## Table Detail

### `journal_articles`
**Used by:** `/journal` (public frontend), `/api/drafts` publish trigger

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `slug` | VARCHAR(255) UNIQUE | Used in URL |
| `title` | VARCHAR(255) | |
| `body` | TEXT | Markdown |
| `author` | VARCHAR(100) | |
| `hero_image_url` | TEXT | |
| `tags` | VARCHAR(50)[] | |
| `published_at` | TIMESTAMPTZ | Set by trigger or insert |

**Missing fields** (needed for CMS):
- `status` — draft / review / published / archived (currently no status at all)
- `excerpt` — short teaser text
- `category` — article grouping
- `image_alt` — accessibility text
- `seo_title` — overrides `<title>` tag
- `meta_description` — SEO description
- `reading_time_minutes` — display indicator
- `updated_at` — last edit timestamp

---

### `draft_articles`
**Used by:** `/admin/dashboard` (existing), pipeline agents

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `inbox_id` | UUID FK → raw_content_inbox | |
| `slug` | TEXT UNIQUE | |
| `title` | TEXT | |
| `body` | TEXT | |
| `excerpt` | TEXT | |
| `author` | TEXT | Default: 'Redaktionen' |
| `scout_output` | JSONB | Full agent output |
| `relevancy_score` | INTEGER | 1–100 |
| `citations` | JSONB | |
| `hero_image_url` | TEXT | |
| `image_prompt` | TEXT | |
| `review_status` | VARCHAR(30) | pending_review/approved/rejected/published |
| `reviewed_by` | TEXT | |
| `reviewed_at` | TIMESTAMPTZ | |
| `rejection_note` | TEXT | |
| `pipeline_stage` | VARCHAR(30) | scout/researcher/editor/visualizer/complete |
| `tags` | TEXT[] | |
| `affiliate_link` | TEXT | Added v1.6 |
| `published_at` | TIMESTAMPTZ | Added v1.6 |

---

### `raw_content_inbox`
**Used by:** Pipeline agents (Harvester, Scout)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `source` | VARCHAR(50) | pubmed/google_grounding/etc |
| `source_id` | TEXT | External ID |
| `source_url` | TEXT | |
| `title` | TEXT | |
| `abstract` | TEXT | |
| `published_at` | TIMESTAMPTZ | |
| `authors` | TEXT[] | |
| `raw_payload` | JSONB | |
| `relevancy_score` | INTEGER | Set by Scout |
| `scout_output` | JSONB | |
| `scored_at` | TIMESTAMPTZ | |
| `status` | VARCHAR(30) | pending/promoted/below_threshold |
| `created_at` | TIMESTAMPTZ | |

---

### `products`
**Used by:** `/` (home), `/shop`, `/api/checkout`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `shopify_product_id` | VARCHAR(255) UNIQUE | |
| `name` | VARCHAR(255) | |
| `thc_percentage` | NUMERIC(4,2) | |
| `supplier_id` | UUID FK → members | |
| `description_standard` | TEXT | v1.3 |
| `description_compliant` | TEXT | v1.3 |
| `tags` | VARCHAR(50)[] | v1.3 |
| `price` | NUMERIC(10,2) | v1.3 |
| `image_url` | TEXT | v1.3 |
| `category` | TEXT | v1.3 seed |

---

### `members` — PRIVATE
| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `email` | VARCHAR(255) UNIQUE | |
| `partner_level` | VARCHAR(50) | medlem/andelshaver/premium_partner |
| `is_democratically_verified` | BOOLEAN | |
| `has_employee_ownership` | BOOLEAN | |

**Security concern:** Contains PII (email addresses). Must never be publicly accessible.

---

### `transactions` — PRIVATE
| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `member_id` | UUID FK → members | |
| `shopify_order_id` | VARCHAR(255) UNIQUE | |
| `amount` | NUMERIC(15,2) | |
| `points_generated` | NUMERIC(15,2) | |
| `status` | VARCHAR(50) | completed/pending/refunded/failed |
| `gclid` | VARCHAR(255) | v1.3 |
| `click_id` | VARCHAR(255) | v1.3 |
| `utm_source` | VARCHAR(255) | v1.3 |
| `affiliate_id` | VARCHAR(255) | v1.3 |

**Security concern:** Contains financial data + member linkage. Must never be publicly accessible.

---

### `payment_gateways` — PRIVATE
| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | VARCHAR(100) UNIQUE | |
| `status` | VARCHAR(50) | active/inactive/frozen |
| `priority` | INTEGER | |
| `api_key_vault_ref` | VARCHAR(255) | Never raw keys |

**Security concern:** Contains infrastructure secrets reference. Must never be publicly accessible.

---

### `country_compliance`
| Field | Type | Notes |
|---|---|---|
| `country_code` | VARCHAR(2) PK | |
| `country_name` | VARCHAR(100) | |
| `country_allowed` | BOOLEAN | |
| `thc_threshold` | NUMERIC(4,2) | |
| `medical_claims_forbidden` | BOOLEAN | |
| `requires_club_membership` | BOOLEAN | |

**Note:** Safe to expose publicly (used for geo-filtering on the frontend).

---

### `member_shares` — PRIVATE
| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `member_id` | UUID FK → members | |
| `year` | INTEGER | |
| `points_raw` | NUMERIC(15,2) | |
| `points_scaled` | NUMERIC(15,2) | Anti-whale capped |

---

### `democratic_certificates` — PRIVATE
| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `member_id` | UUID FK → members | |
| `document_url` | TEXT | IPFS |
| `employee_ownership_percentage` | NUMERIC(5,2) | |
| `status` | VARCHAR(50) | pending/approved/rejected |
| `verifier_id` | UUID FK → members | |
| `verified_at` | TIMESTAMPTZ | |

---

## Security Concerns

### Critical
1. **RLS disabled on all tables** — any API key (anon or service) can read/write everything
2. **`members.email`** is PII — GDPR exposure if leaked
3. **`transactions`** links members to financial amounts
4. **`payment_gateways.api_key_vault_ref`** exposes infrastructure config

### Medium
5. `raw_content_inbox.raw_payload` may contain full API responses with internal metadata
6. `draft_articles.scout_output` contains internal AI agent prompts/responses

### Action Required
- Enable RLS on all tables
- Public read: `journal_articles` (published only), `products`, `country_compliance`
- Admin-only: everything else via service role key
- See `migration_v1.8.sql` for proposed policies

---

## Architecture Notes

- **DB access pattern:** Direct PostgreSQL via `pg` driver (`src/lib/db.ts`) using `DATABASE_URL` env var — bypasses Supabase RLS entirely. RLS policies only protect the Supabase REST API layer.
- **Rendering:** Journal pages use `generateStaticParams` + static generation — **content updates require a Vercel redeploy to appear**. Must switch to dynamic rendering for CMS-driven content.

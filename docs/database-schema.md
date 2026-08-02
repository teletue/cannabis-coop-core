# Database Schema — weeds.dk
**Last updated:** 2026-07-31
**Migrations applied:** v1.3, v1.5, v1.6, v1.7, v1.8, v1.9

---

## journal_articles

Live public articles. Read by `/journal` (frontend) and managed via `/admin/articles`.

```sql
id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4()
slug                  VARCHAR(255) UNIQUE NOT NULL
title                 VARCHAR(255) NOT NULL
body                  TEXT NOT NULL
author                VARCHAR(100) NOT NULL
hero_image_url        TEXT NOT NULL
tags                  VARCHAR(50)[] DEFAULT '{}'
published_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
-- v1.7 additions:
status                VARCHAR(30) NOT NULL DEFAULT 'published'  -- draft|review|published|archived
excerpt               TEXT
category              VARCHAR(100)
image_alt             TEXT
seo_title             TEXT
meta_description      TEXT
reading_time_minutes  INTEGER
updated_at            TIMESTAMPTZ DEFAULT NOW()
```

**Indexes:** `idx_journal_status` on `status`
**Triggers:** `trg_journal_updated_at` — auto-sets `updated_at` on write
**RLS:** Public reads only where `status = 'published'`

---

## draft_articles

Pipeline staging area. Managed via `/admin/drafts`.

```sql
id                UUID PRIMARY KEY DEFAULT uuid_generate_v4()
inbox_id          UUID REFERENCES raw_content_inbox(id) ON DELETE SET NULL
slug              TEXT UNIQUE
title             TEXT NOT NULL
body              TEXT
excerpt           TEXT
author            TEXT DEFAULT 'Redaktionen'
scout_output      JSONB
relevancy_score   INTEGER
citations         JSONB DEFAULT '[]'
hero_image_url    TEXT
image_prompt      TEXT
review_status     VARCHAR(30) NOT NULL DEFAULT 'pending_review'
                  -- pending_review|approved|rejected|published
reviewed_by       TEXT
reviewed_at       TIMESTAMPTZ
rejection_note    TEXT
pipeline_stage    VARCHAR(30) DEFAULT 'scout'
                  -- scout|researcher|editor|visualizer|complete
tags              TEXT[] DEFAULT '{}'
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()
-- v1.6 additions:
affiliate_link    TEXT
published_at      TIMESTAMPTZ
```

**Triggers:** `trg_draft_updated_at`, `trg_draft_published_at`
**RLS:** Admin-only (authenticated role)

---

## raw_content_inbox

Harvested external signals. Managed via `/admin/inbox`.

```sql
id               UUID PRIMARY KEY DEFAULT uuid_generate_v4()
source           VARCHAR(50) NOT NULL       -- pubmed|google_grounding|ema
source_id        TEXT
source_url       TEXT
title            TEXT NOT NULL
abstract         TEXT
published_at     TIMESTAMPTZ
authors          TEXT[]
raw_payload      JSONB DEFAULT '{}'
relevancy_score  INTEGER                    -- 1–100, NULL = not scored
scout_output     JSONB
scored_at        TIMESTAMPTZ
status           VARCHAR(30) NOT NULL DEFAULT 'pending'
                 -- pending|scored|below_threshold|promoted|ignored|ready_for_draft|error
created_at       TIMESTAMPTZ DEFAULT NOW()
-- v1.9 additions:
editor_notes     TEXT
updated_at       TIMESTAMPTZ DEFAULT NOW()
```

**Indexes:** `idx_inbox_status`, `idx_inbox_source`, `idx_inbox_relevancy_score`, `idx_inbox_created_at`, `idx_inbox_source_id_unique` (unique on source+source_id)
**Triggers:** `trg_inbox_updated_at`
**RLS:** Admin-only (authenticated role)

---

## products

Product catalog. Read by `/shop` and homepage.

```sql
id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4()
shopify_product_id     VARCHAR(255) UNIQUE NOT NULL
name                   VARCHAR(255) NOT NULL
thc_percentage         NUMERIC(4,2) DEFAULT 0.00
supplier_id            UUID REFERENCES members(id) ON DELETE CASCADE
created_at             TIMESTAMPTZ DEFAULT NOW()
updated_at             TIMESTAMPTZ DEFAULT NOW()
-- v1.3 additions:
description_standard   TEXT DEFAULT ''
description_compliant  TEXT DEFAULT ''
tags                   VARCHAR(50)[] DEFAULT '{}'
price                  NUMERIC(10,2) DEFAULT 0.00
image_url              TEXT
category               TEXT  -- from seed data
```

**RLS:** Public read

---

## members

Cooperative membership records. **Private — contains PII.**

```sql
id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4()
email                       VARCHAR(255) UNIQUE NOT NULL
partner_level               VARCHAR(50) DEFAULT 'medlem'
                            -- medlem|andelshaver|premium_partner
is_democratically_verified  BOOLEAN DEFAULT FALSE
has_employee_ownership      BOOLEAN DEFAULT FALSE
created_at                  TIMESTAMPTZ DEFAULT NOW()
updated_at                  TIMESTAMPTZ DEFAULT NOW()
```

**Constraint:** `premium_partner` requires `is_democratically_verified = TRUE`
**RLS:** Admin-only

---

## member_shares

Points ledger per member per year. **Private.**

```sql
id            UUID PRIMARY KEY DEFAULT uuid_generate_v4()
member_id     UUID REFERENCES members(id) ON DELETE CASCADE
year          INTEGER
points_raw    NUMERIC(15,2) DEFAULT 0.00
points_scaled NUMERIC(15,2) DEFAULT 0.00  -- anti-whale capped
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ DEFAULT NOW()
UNIQUE (member_id, year)
```

**Trigger:** `trigger_calculate_shares` — applies progressive cap on insert/update
**RLS:** Admin-only

---

## transactions

Payment/order history. **Private — contains financial data.**

```sql
id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4()
member_id          UUID REFERENCES members(id) ON DELETE CASCADE
shopify_order_id   VARCHAR(255) UNIQUE
amount             NUMERIC(15,2)
points_generated   NUMERIC(15,2)
status             VARCHAR(50) DEFAULT 'completed'
                   -- completed|pending|refunded|failed
created_at         TIMESTAMPTZ DEFAULT NOW()
updated_at         TIMESTAMPTZ DEFAULT NOW()
-- v1.3 additions:
gclid              VARCHAR(255)
click_id           VARCHAR(255)
utm_source         VARCHAR(255)
affiliate_id       VARCHAR(255)
```

**Trigger:** `trigger_sync_transaction_points` — syncs to member_shares ledger
**RLS:** Admin-only

---

## payment_gateways

Payment gateway routing config. **Private.**

```sql
id                UUID PRIMARY KEY DEFAULT uuid_generate_v4()
name              VARCHAR(100) UNIQUE NOT NULL
status            VARCHAR(50) DEFAULT 'active'  -- active|inactive|frozen
priority          INTEGER DEFAULT 1
api_key_vault_ref VARCHAR(255)  -- vault reference, never raw keys
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()
```

**RLS:** Admin-only

---

## country_compliance

Geo-compliance rules. Read by frontend for geo-filtering.

```sql
country_code               VARCHAR(2) PRIMARY KEY
country_name               VARCHAR(100) NOT NULL
country_allowed            BOOLEAN DEFAULT TRUE
thc_threshold              NUMERIC(4,2) DEFAULT 0.30
medical_claims_forbidden   BOOLEAN DEFAULT TRUE
requires_club_membership   BOOLEAN DEFAULT FALSE
updated_at                 TIMESTAMPTZ DEFAULT NOW()
```

**RLS:** Public read

---

## democratic_certificates

Governance proof documents. **Private.**

```sql
id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4()
member_id                     UUID REFERENCES members(id) ON DELETE CASCADE
document_url                  TEXT NOT NULL  -- IPFS
employee_ownership_percentage NUMERIC(5,2)
status                        VARCHAR(50) DEFAULT 'pending'  -- pending|approved|rejected
verifier_id                   UUID REFERENCES members(id) ON DELETE SET NULL
notes                         TEXT
verified_at                   TIMESTAMPTZ
created_at                    TIMESTAMPTZ DEFAULT NOW()
updated_at                    TIMESTAMPTZ DEFAULT NOW()
```

**Trigger:** `trigger_sync_democratic_certificate` — auto-updates member verification status
**RLS:** Admin-only

---

## RLS Summary

| Table | anon/authenticated SELECT | Admin write |
|---|---|---|
| `journal_articles` | ✅ `status = 'published'` only | ✅ |
| `products` | ✅ all rows | ✅ |
| `country_compliance` | ✅ all rows | ✅ |
| `draft_articles` | ❌ | ✅ |
| `raw_content_inbox` | ❌ | ✅ |
| `members` | ❌ | ✅ |
| `member_shares` | ❌ | ✅ |
| `transactions` | ❌ | ✅ |
| `payment_gateways` | ❌ | ✅ |
| `democratic_certificates` | ❌ | ✅ |

> **Note:** The Next.js app connects via `pg` with the service role and bypasses RLS. These policies protect the Supabase REST API only.

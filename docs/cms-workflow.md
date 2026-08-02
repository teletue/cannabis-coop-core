# CMS Workflow — weeds.dk
**Last updated:** 2026-07-31

---

## Access

**URL:** `www.weeds.dk/admin`
**Login:** Shared admin secret (set as `ADMIN_SECRET` in Vercel env vars)
**Session:** 8-hour HTTP-only cookie
**Logout:** "Log ud" button (bottom-right corner on all admin pages)

---

## CMS Sections

### `/admin` — Dashboard
Overview of all content areas with live counts:
- Published articles
- Total drafts
- Pending review
- Raw signals

---

### `/admin/articles` — Journal Articles

These are **live articles** that appear on `weeds.dk/journal` when `status = 'published'`.

**List view:** All articles sorted by publish date. Status badge on each row.

**Edit view** (`/admin/articles/[id]`):

| Field | Editable | Notes |
|---|---|---|
| Titel | ✅ | |
| Slug | ✅ | Used in public URL `/journal/[slug]` |
| Body (Markdown) | ✅ | Full article content |
| Excerpt | ✅ | Short teaser |
| Forfatter | ✅ | |
| Status | ✅ | `draft` / `review` / `published` / `archived` |
| Kategori | ✅ | |
| Tags | ✅ | Comma-separated |
| Hero Image URL | ✅ | Preview shown inline |
| Alt-tekst | ✅ | Accessibility + SEO |
| SEO Titel | ✅ | Overrides browser title |
| Meta Description | ✅ | Max ~160 chars |

**Save:** Click "Gem ændringer" → `PATCH /api/admin/articles/[id]`

**Status behavior:**
- Setting status to `published` sets `published_at = NOW()` automatically
- Only `published` articles appear on the public site
- `archived` articles are hidden but not deleted

---

### `/admin/drafts` — Pipeline Drafts

Articles generated or promoted by the AI pipeline, awaiting editorial review.

Uses `draft_articles` table. Reuses the `ArticleTable` component.

| Action | Effect |
|---|---|
| **Godkend** | Sets `review_status = 'published'` → copies row to `journal_articles` |
| **Slet** | Permanently deletes the draft |
| Edit affiliate link | Inline input, saved via PATCH |

**Note:** Publishing a draft here copies it to `journal_articles` — it then appears in `/admin/articles` for further editing.

---

### `/admin/inbox` — Raw Signals

Harvested external signals (PubMed abstracts, news items). Not articles — see `raw-signals-workflow.md` for the distinction.

**List view:** All signals with source, score, and status badge. Click any item to edit.

**Edit view** (`/admin/inbox/[id]`):

| Field | Editable | Notes |
|---|---|---|
| Titel | ✅ | |
| Abstract / råtekst | ✅ | Original content from source |
| Kilde-URL | ✅ | |
| Relevans-score | ✅ | 1–100, or blank |
| Status | ✅ | See status table below |
| Redaktørnoter | ✅ | Internal only |
| Kildeinfo | ❌ | Read-only: source, external ID, pub date, authors |
| Scout-output | ❌ | Read-only JSON viewer |

**Quick actions:**

| Button | Sets status to |
|---|---|
| Ignorer | `ignored` |
| Klar til kladde | `ready_for_draft` |

**Status values:** `pending` · `scored` · `below_threshold` · `promoted` · `ignored` · `ready_for_draft` · `error`

---

## Content Pipeline Summary

```
Raw signal (inbox)
  → mark "ready_for_draft" (manual) OR score ≥ 75 (automatic)
  → promoted to draft_articles
  → editor reviews in /admin/drafts
  → "Godkend" → copied to journal_articles
  → editor refines in /admin/articles/[id]
  → status = 'published'
  → visible on weeds.dk/journal
```

---

## What the CMS does NOT do (yet)

- No rich text editor — body is raw Markdown
- No image upload — paste a URL manually
- No user management — single shared secret
- No audit log — no record of who changed what
- No draft preview — save first, then check `/journal/[slug]`

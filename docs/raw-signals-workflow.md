# Raw Signals Workflow

## How raw signals differ from drafts and published articles

| | Raw Signal (`raw_content_inbox`) | Draft (`draft_articles`) | Published (`journal_articles`) |
|---|---|---|---|
| **What it is** | A harvested external signal — a PubMed abstract, a news headline, a research finding | An article being written or reviewed by an editor | A live article visible on weeds.dk |
| **Source** | Automated pipeline agents (Harvester → Scout) | Promoted from a raw signal, or written manually | Promoted from a draft |
| **Has body text?** | No — only the original `abstract` from the source | Yes — Danish markdown `body` | Yes — final markdown `body` |
| **Has slug?** | No | Optional — auto-generated on publish | Yes — required for URL |
| **Has SEO fields?** | No | No | Yes — `seo_title`, `meta_description` |
| **Public?** | Never | Never | Only when `status = 'published'` |
| **Status values** | `pending`, `scored`, `below_threshold`, `promoted`, `ignored`, `ready_for_draft`, `error` | `pending_review`, `approved`, `rejected`, `published` | `draft`, `review`, `published`, `archived` |

---

## Field mapping

| CMS label | DB column | Type | Notes |
|---|---|---|---|
| Titel | `title` | TEXT | Original title from source |
| Abstract / råtekst | `abstract` | TEXT | Original content snippet |
| Kilde | `source` | VARCHAR(50) | `pubmed`, `google_grounding`, etc. |
| Kilde-URL | `source_url` | TEXT | Link to original |
| Relevans-score | `relevancy_score` | INTEGER 1–100 | NULL = not yet scored |
| Status | `status` | VARCHAR(30) | See status table below |
| Redaktørnoter | `editor_notes` | TEXT | Internal only, never public |
| Scout-output | `scout_output` | JSONB | Read-only in CMS — full agent JSON |

---

## Status meanings

| Status | Meaning |
|---|---|
| `pending` | Newly harvested, not yet processed |
| `scored` | Scout agent has assigned a relevancy score |
| `below_threshold` | Score too low to be promoted |
| `promoted` | Converted to a draft article |
| `ignored` | Manually dismissed by editor — will not be processed |
| `ready_for_draft` | Manually approved by editor, awaiting conversion to draft |
| `error` | Processing failed |

---

## Editor actions in CMS

**URL:** `/admin/inbox/[id]`

| Action | Effect |
|---|---|
| Edit title / abstract / source_url / score | Saves directly to Supabase via PATCH |
| Change status dropdown | Saves any valid status |
| **Ignorer** button | Sets `status = 'ignored'` |
| **Klar til kladde** button | Sets `status = 'ready_for_draft'` |
| Save | PATCH `/api/admin/inbox/[id]` |

---

## What raw signals do NOT have

Raw signals are **not articles**. They do not have:
- `slug` — no public URL exists
- `body` — no written content yet
- `seo_title` / `meta_description` — SEO is irrelevant at this stage
- `hero_image_url` — no visual asset yet
- `category` / `tags` — classification happens at draft stage

These fields are added when the signal is promoted to a draft, which is a separate pipeline step.

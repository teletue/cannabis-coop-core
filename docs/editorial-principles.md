# Editorial Principles — weeds.dk
**Last updated:** 2026-07-31

---

## Voice & Tone

Clinical, editorial voice. Not a lifestyle brand — a cooperative with a position.

- Write like a scientist who respects the reader
- No hype, no wellness clichés, no marketing language
- Danish for public content; English for internal notes
- Short sentences. Precise claims. Cite sources where possible

---

## Content Types

**Journal Articles** — long-form editorial content at `/journal/[slug]`. Must have `title`, `slug`, `body`, `author`, `status`. Only `published` is publicly visible.

**Raw Signals** — inputs to the editorial process. Never public. Evaluate quickly: `ready_for_draft` or `ignored`.

**Draft Articles** — work in progress. Not public. Editor reviews, edits, then approves or deletes.

---

## Status Guide

**journal_articles:** `draft` → `review` → `published` · `archived` = hidden but kept

**draft_articles:** `pending_review` → `approved` / `rejected` · `published` = copied to journal

**raw_content_inbox:** `pending` → `scored` → `ready_for_draft` / `ignored` / `below_threshold`

---

## Publishing Checklist

Before setting `status = 'published'` on a journal article:

- [ ] `title` is clear and accurate
- [ ] `slug` is URL-safe (lowercase, hyphens, no special chars)
- [ ] `body` is complete Danish markdown
- [ ] `excerpt` is filled in (1–2 sentences)
- [ ] `hero_image_url` is set and loads correctly
- [ ] `image_alt` describes the image
- [ ] `meta_description` is under 160 characters
- [ ] `tags` are relevant and lowercase

---

## What We Don't Publish

- Medical claims without scientific sourcing
- Promotional content for external brands
- Content that violates Danish advertising law for cannabis/CBD
- Anything that hasn't been reviewed by a human editor

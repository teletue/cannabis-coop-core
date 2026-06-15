import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { runHarvester } from '@/lib/agents/harvester';
import { runScout, PROMOTION_THRESHOLD } from '@/lib/agents/scout';
import type { RawSignal } from '@/lib/agents/harvester';

/**
 * POST /api/pipeline/run
 * Triggers Agent 1 (Harvester) + Agent 2 (Scout) in sequence.
 * Protected by PIPELINE_SECRET to prevent unauthorised runs.
 *
 * Cron (Vercel) example:
 *   Schedule: 0 6 * * *   →   curl -X POST https://weeds.dk/api/pipeline/run \
 *     -H "Authorization: Bearer $PIPELINE_SECRET"
 */
export async function POST(request: Request) {
  // ── Auth check ───────────────────────────────────────────────────────────
  const secret = process.env.PIPELINE_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const stats = {
    harvested: 0,
    already_known: 0,
    scored: 0,
    promoted: 0,
    below_threshold: 0,
    errors: [] as string[],
  };

  // ── Step 1: Harvest ──────────────────────────────────────────────────────
  let signals: RawSignal[] = [];
  try {
    const result = await runHarvester(10);
    signals = [...result.pubmed, ...result.google_news];
    stats.harvested = signals.length;
    stats.errors.push(...result.errors);
    console.log(`[Pipeline] Harvested ${signals.length} signals`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Harvester failed: ${msg}`, stats }, { status: 500 });
  }

  // ── Step 2: Persist raw signals (deduplicated) ───────────────────────────
  const persistedIds: Array<{ dbId: string; signal: RawSignal }> = [];

  for (const signal of signals) {
    try {
      const res = await query(
        `INSERT INTO raw_content_inbox
           (source, source_id, source_url, title, abstract, published_at, authors, raw_payload, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
         ON CONFLICT (source, source_id) DO NOTHING
         RETURNING id`,
        [
          signal.source,
          signal.source_id,
          signal.source_url,
          signal.title,
          signal.abstract,
          signal.published_at,
          signal.authors,
          JSON.stringify(signal.raw_payload),
        ]
      );

      if (res.rows.length === 0) {
        stats.already_known++;
      } else {
        persistedIds.push({ dbId: res.rows[0].id, signal });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      stats.errors.push(`DB insert (${signal.source_id}): ${msg}`);
    }
  }

  // ── Step 3: Scout scores each new signal ─────────────────────────────────
  for (const { dbId, signal } of persistedIds) {
    try {
      const scoutOutput = await runScout(signal);
      stats.scored++;

      const isPromoted = scoutOutput.relevancy_score >= PROMOTION_THRESHOLD;

      // Update inbox row with Scout result
      await query(
        `UPDATE raw_content_inbox
         SET relevancy_score = $1,
             scout_output    = $2,
             scored_at       = NOW(),
             status          = $3
         WHERE id = $4`,
        [
          scoutOutput.relevancy_score,
          JSON.stringify(scoutOutput),
          isPromoted ? 'promoted' : 'below_threshold',
          dbId,
        ]
      );

      // Promote to draft_articles if score >= threshold
      if (isPromoted) {
        await query(
          `INSERT INTO draft_articles
             (inbox_id, title, scout_output, relevancy_score, tags, pipeline_stage, review_status)
           VALUES ($1, $2, $3, $4, $5, 'scout', 'pending_review')
           ON CONFLICT DO NOTHING`,
          [
            dbId,
            signal.title,
            JSON.stringify(scoutOutput),
            scoutOutput.relevancy_score,
            [],
          ]
        );
        stats.promoted++;
        console.log(`[Pipeline] Promoted: "${signal.title}" (score: ${scoutOutput.relevancy_score})`);
      } else {
        stats.below_threshold++;
        console.log(`[Pipeline] Below threshold: "${signal.title}" (score: ${scoutOutput.relevancy_score})`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      stats.errors.push(`Scout (${signal.source_id}): ${msg}`);
    }
  }

  return NextResponse.json({
    ok: true,
    stats,
    threshold: PROMOTION_THRESHOLD,
  });
}

/**
 * GET /api/pipeline/run
 * Returns pipeline status summary (inbox counts by status).
 */
export async function GET(request: Request) {
  const secret = process.env.PIPELINE_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const res = await query(
      `SELECT status, COUNT(*) as count
       FROM raw_content_inbox
       GROUP BY status
       ORDER BY status`
    );

    const draftsRes = await query(
      `SELECT review_status, COUNT(*) as count
       FROM draft_articles
       GROUP BY review_status
       ORDER BY review_status`
    );

    return NextResponse.json({
      inbox: res.rows,
      drafts: draftsRes.rows,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Agent 2: The Scout
 * Performs semantic analysis on a raw signal and returns a structured
 * JSON briefing + relevancy score (1–100).
 * Only articles scoring >= PROMOTION_THRESHOLD are promoted to draft_articles.
 */

import type { RawSignal } from './harvester';

export const PROMOTION_THRESHOLD = 75;

export interface ScoutOutput {
  relevancy_score: number;
  context_briefing: {
    why_it_matters: string;
    scientific_impact: string;
    actors: string[];
    connection_to_core_topics: string;
  };
}

const SCOUT_SYSTEM_PROMPT = `Du er "The Scout", efterretnings- og kontekst-analytikeren for weeds.dk.
Din opgave er at analysere den indgående nyhedssignal-payload og udtrække den dybe, bagvedliggende relevans. Du skal fuldstændig undgå overfladiske resuméer.
Udfør analysen baseret på følgende fire søjler:
1. REGULATIV & VIDENSKABELIG BETYDNING: Hvad er den reelle fysiologiske, kliniske eller juridiske konsekvens af dette signal?
2. HOVEDAKTØRER: Hvilke forskningsinstitutioner, myndigheder eller selskaber driver denne udvikling?
3. SYNERGI MED WEEDS.DK: Hvordan bygger dette ovenpå vores eksisterende vidensfundament (særligt omkring fytokemi, restitution og cirkadisk homøostase)?
4. RELEVANS-SCORE: Tildel en score fra 1 til 100 baseret på, hvorvidt dette signal fortjener en dybdegående artikel henvendt til et modent (35-65 år), sundhedsorienteret B2C-publikum.
Returner KUN et JSON-objekt i præcis dette format uden markdown-formatering:
{
  "relevancy_score": <int>,
  "context_briefing": {
    "why_it_matters": "<1-2 sætninger, der forklarer vigtigheden for læseren>",
    "scientific_impact": "<fysiologisk eller regulativ analyse>",
    "actors": ["<aktør 1>", "<aktør 2>"],
    "connection_to_core_topics": "<forbindelse til weeds.dk's eksisterende fokus>"
  }
}`;

export async function runScout(signal: RawSignal): Promise<ScoutOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('[Scout] OPENAI_API_KEY is not set');
  }

  const userContent = JSON.stringify({
    title: signal.title,
    abstract: signal.abstract,
    source: signal.source,
    authors: signal.authors,
    published_at: signal.published_at,
    url: signal.source_url,
  });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SCOUT_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[Scout] OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;

  if (!raw) throw new Error('[Scout] Empty response from OpenAI');

  const parsed: ScoutOutput = JSON.parse(raw);

  if (
    typeof parsed.relevancy_score !== 'number' ||
    !parsed.context_briefing
  ) {
    throw new Error('[Scout] Invalid JSON structure from OpenAI');
  }

  return parsed;
}

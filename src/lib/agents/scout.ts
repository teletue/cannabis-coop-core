/**
 * Agent 2: The Scout
 * Uses Gemini 1.5 Flash with Google Search Grounding to:
 *   1. Discover recent news signals autonomously (runScoutWithGrounding)
 *   2. Score a pre-fetched signal from PubMed (runScout)
 *
 * Both modes use a single GOOGLE_API_KEY via @google/generative-ai SDK.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
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

export interface GroundedSignal {
  title: string;
  url: string;
  snippet: string;
  scout_output: ScoutOutput;
}

function getModel() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('[Scout] GOOGLE_API_KEY is not set');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    // Enable Google Search Grounding
    tools: [{ googleSearchRetrieval: {} }],
  });
}

const SCOUT_PERSONA = `Du er "The Scout", efterretnings- og kontekst-analytikeren for weeds.dk.
Din opgave er at udtrække den dybe, bagvedliggende relevans af et signal. Undgå overfladiske resuméer.
Analysér baseret på fire søjler:
1. REGULATIV & VIDENSKABELIG BETYDNING: Den reelle fysiologiske, kliniske eller juridiske konsekvens.
2. HOVEDAKTØRER: Forskningsinstitutioner, myndigheder eller selskaber der driver udviklingen.
3. SYNERGI MED WEEDS.DK: Forbindelse til fytokemi, restitution og cirkadisk homøostase.
4. RELEVANS-SCORE: 1–100 for et modent (35-65 år), sundhedsorienteret B2C-publikum.
Returner KUN dette JSON-objekt (ingen markdown, ingen forklaring):
{
  "relevancy_score": <int>,
  "context_briefing": {
    "why_it_matters": "<1-2 sætninger>",
    "scientific_impact": "<fysiologisk eller regulativ analyse>",
    "actors": ["<aktør 1>", "<aktør 2>"],
    "connection_to_core_topics": "<forbindelse til weeds.dk's fokus>"
  }
}`;

function parseScoutJson(raw: string): ScoutOutput {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed: ScoutOutput = JSON.parse(cleaned);
  if (typeof parsed.relevancy_score !== 'number' || !parsed.context_briefing) {
    throw new Error('[Scout] Invalid JSON structure in Gemini response');
  }
  return parsed;
}

// ─── Mode 1: Score a pre-fetched PubMed signal ───────────────────────────────

export async function runScout(signal: RawSignal): Promise<ScoutOutput> {
  const model = getModel();

  const prompt = `${SCOUT_PERSONA}

Analysér dette signal og returner JSON:
${JSON.stringify({
    title: signal.title,
    abstract: signal.abstract,
    source: signal.source,
    authors: signal.authors,
    published_at: signal.published_at,
    url: signal.source_url,
  })}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  return parseScoutJson(raw);
}

// ─── Mode 2: Autonomous topic discovery via Search Grounding ─────────────────

const WATCH_TOPICS = [
  'European cannabis regulation news 2025',
  'cannabinoid clinical trial results pain sleep',
  'phytochemical endocannabinoid system research',
  'hemp CBD policy Denmark Scandinavia',
];

export async function runScoutWithGrounding(
  topics: string[] = WATCH_TOPICS,
  maxPerTopic = 3,
): Promise<GroundedSignal[]> {
  const model = getModel();
  const signals: GroundedSignal[] = [];

  for (const topic of topics) {
    try {
      const prompt = `${SCOUT_PERSONA}

Brug Google Search til at finde de ${maxPerTopic} seneste og mest relevante nyheder eller videnskabelige artikler om dette emne:
"${topic}"

For HVERT fund, returner et JSON-array med objekter i dette format:
[
  {
    "title": "<artiklens titel>",
    "url": "<kildens URL>",
    "snippet": "<kort resumé på 1-2 sætninger>",
    "scout_output": { <ScoutOutput JSON som beskrevet ovenfor> }
  }
]
Returner KUN JSON-arrayet, ingen anden tekst.`;

      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

      const parsed: GroundedSignal[] = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        signals.push(...parsed.slice(0, maxPerTopic));
      }
    } catch (err) {
      console.error(`[Scout] Grounding failed for topic "${topic}":`, err);
    }
  }

  return signals;
}

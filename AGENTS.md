<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Operationel log (gælder hele projektet)

FØR der foretages nogen ændring i koden, skrives en post i `logbog.md` (projektroden) der kort deklarerer: hvad der ændres, hvilke filer der berøres, og hvordan invarianter respekteres. Skriv aldrig kode før log-posten. Format: se eksisterende poster i `logbog.md`.

## Browsertests må ikke forurene statistikken

Sidestatistikken (sessioner/sidevisninger i `page_session_counts` og `page_daily_counts`) er anonym og kan ikke rydde testtrafik op bagefter. Kør derfor ALTID automatiserede browsertests (Playwright m.v.) med Do Not Track slået til — `SessionCounter` og `/notesbogen` springer tælling over, når DNT er `1`. I Playwright: `browser.newContext({ extraHTTPHeaders: { DNT: '1' } })` er ikke nok, fordi tjekket sker på `navigator.doNotTrack`; brug i stedet `context.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }))`. Tests, der specifikt skal verificere selve tællingen, er undtaget — men skal nævnes i `logbog.md`.

## /notesbogen (public/notesbogen/index.html)

Denne side er underlagt `lov.md` og KUN denne side: udelukkende HTML, vanilla JavaScript og Tailwind via CDN. Ingen frameworks, intet build-step, append-only, honeypot i alle formularer, monokrom noir-æstetik. Konverter den aldrig til React, og lad den aldrig få site-chrome (Navigation/Footer).

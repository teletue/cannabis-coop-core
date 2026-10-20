<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Operationel log (gælder hele projektet)

FØR der foretages nogen ændring i koden, skrives en post i `logbog.md` (projektroden) der kort deklarerer: hvad der ændres, hvilke filer der berøres, og hvordan invarianter respekteres. Skriv aldrig kode før log-posten. Format: se eksisterende poster i `logbog.md`.

## /notesbogen (public/notesbogen/index.html)

Denne side er underlagt `lov.md` og KUN denne side: udelukkende HTML, vanilla JavaScript og Tailwind via CDN. Ingen frameworks, intet build-step, append-only, honeypot i alle formularer, monokrom noir-æstetik. Konverter den aldrig til React, og lad den aldrig få site-chrome (Navigation/Footer).

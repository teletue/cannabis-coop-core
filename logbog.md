# SKYGGESPOR // OPERATIONEL LOG
Her deklareres alle systemiske ændringer før de eksekveres. Koden rører ikke sig selv, før intentionen er skrevet i sten.

---
**20. oktober 2026 - 08:29 - INITIALISERING**
* **Opgave:** Oprettelse af log-system.
* **Filer berørt:** lov.md, logbog.md.
* **Arkitektonisk konsekvens:** Kontroltårn etableret. Agenten er nu tvunget til at deklarere intention forud for eksekvering. Invarianter bevaret.
---
**20. oktober 2026 - 14:30 - NOTESBOGEN INDTAGER HOVEDSITTET**
* **Opgave:** Integration af den statiske noir-notesbog (index.html fra web_2.0) på weeds.dk som /notesbogen, med samme anonyme funktionalitet som øvrige offentlige sider: sessions- og besøgstælling (10-minutters inaktivitetsvindue, DNT-respekt) mod /api/session-count og /api/page-view.
* **Filer berørt:** public/notesbogen/index.html (ny), lov.md (ny), logbog.md (denne fil), AGENTS.md.
* **Arkitektonisk konsekvens:** Siden forbliver ren HTML + Vanilla JS + Tailwind via CDN, serveret statisk fra public/. Ingen framework, intet build-step trænger sig ind herfra. Honeypot og append-only-strukturen står urørt. Koden rører sig i mørke, tæller fodspor, og lader de levende være i fred. Invarianter bevaret.
---
**20. oktober 2026 - 14:36 - DEN RENE ADRESSE**
* **Opgave:** Give notesbogen en ren URL (/notesbogen) i stedet for /notesbogen/index.html. Next.js' trailingSlash-mekanik ville ellers omdirigere mappen til en blindgyde.
* **Filer berørt:** next.config.ts.
* **Arkitektonisk konsekvens:** En stille rewrite sender /notesbogen direkte til den statiske fil — intet build-step, ingen ændring af selve dokumentet. Adressen bliver ren; maskinen ser ikke forskel. Invarianter bevaret.
---
**20. oktober 2026 - 14:41 - ET DØRSKILT TIL MØRKET**
* **Opgave:** Notesbogen holdt sig for godt skjult — selv ejermanden kunne ikke finde døren ind. Tilføjelse af et link (»Notesbogen«) i footerens Explore-spalte, så siden kan findes fra alle offentlige sider uden at bryde dens anonyme karakter.
* **Filer berørt:** src/components/layout/Footer.tsx.
* **Arkitektonisk konsekvens:** Ingen chrome omvendt: selve notesbogen røres ikke. Kun et diskret dørskilt udefra. Invarianter bevaret.
---

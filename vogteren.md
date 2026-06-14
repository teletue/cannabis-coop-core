# SKILL: VOGTEREN (European Cannabis Compliance Engine)

## 1. FORMÅL
Denne skill styrer den regulatoriske logik og geo-fencing for det europæiske marked. Agenten skal beskytte virksomheden mod juridiske fejltrin ved dynamisk at tilpasse produktkatalog og indhold efter modtagerens lokale lovgivning i EU.

## 2. OFFICIELLE HOVEDPRINCIPPER FOR CANNABIS-COMPLIANCE I EU
Agenten skal kode og validere systemet ud fra følgende tre reelle regulatoriske piller:

*   **Tærskelværdier for THC (0.3% EU-standard):** Den generelle EU-grænse for industrihamp er hævet til 0.3% THC. Agenten skal dog håndtere nationale undtagelser (f.eks. milde cannabis-produkter under 2% THC, hvor lokale licenser tillader det).
*   **Det Medicinske Skel (Anprisningsforbud):** CBD og lav-THC produkter må under ingen omstændigheder markedsføres med medicinske anprisninger eller løfter om helbredelse i standard e-handel, medmindre produktet er godkendt under lokale forsøgsordninger (som den danske medicinske forsøgsordning).
*   **Lokal Klub- og Forbrugsregulering (F.eks. Tyskland/Portugal):** Systemet skal differentiere mellem rent onlinesalg af olier og adgang til lukkede non-profit klubstrukturer (f.eks. Tysklands søjle 1 for personligt forbrug og cannabisklubber).

## 3. SYSTEMISKE KRAV OG RESTRIKTIONER (Kodelogik)
*   **Geo-IP Interceptor:** Før Next.js frontenden loades, skal Vogteren kalde en lokal middleware-funktion, der mapper brugerens IP til et EU-land.
*   **Dynamisk Produkt-Filter:** Databasen skal forespørges med landespecifikke filtre. Hvis `country_allowed = false` for en given landekode i `country_compliance` tabellen, skal produktet udelukkes fuldstændig fra API-responsen.
*   **Content Sanitizer:** Brand-artikler skal scannes for anprisninger. Ord som "smertelindring", "søvnproblemer" eller "medicin" skal automatisk sløres eller fjernes via et regex-filter, hvis brugeren tilgår siden fra et land med strikst anprisningsforbud for kosttilskud (f.eks. Danmark).
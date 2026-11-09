-- ============================================================================
-- MIGRATION v2.6 — Guides: Brug & Indtag (seks redaktionelle kladder)
-- Run in Supabase SQL Editor
-- All changes are idempotent (ON CONFLICT (slug) DO NOTHING)
--
-- Indsætter seks originale danske guides i draft_articles med
-- review_status = 'pending_review'. Intet publiceres automatisk: hver kladde
-- gennemgås og publiceres fra /admin/drafts, hvorefter den dukker op i
-- /guides (tag 'guide-brug' eller 'guide-indtag') og i /journal.
--
-- Teksterne er skrevet fra bunden. Emnerne er inspireret af cannigma.com/how-to,
-- som er angivet i citations som inspiration/videre læsning.
-- Ingen medicinske anprisninger.
-- ============================================================================

INSERT INTO draft_articles
    (slug, title, excerpt, body, author, tags, citations, review_status, pipeline_stage, relevancy_score)
VALUES

-- ── BRUG 1: Opbevaring ──────────────────────────────────────────────────────
(
  'saadan-opbevarer-du-hampeprodukter',
  'Sådan opbevarer du hampeprodukter, så de holder sig friske',
  'Lys, varme, ilt og fugt er de fire fjender af cannabinoider og terpener. En kort guide til at bevare duft, smag og kvalitet i olier, blomster og salver.',
  $b$Et hampeprodukt er ikke færdigt, når det forlader producenten. Fra det øjeblik flasken eller posen åbnes, begynder et langsomt kemisk forfald. Cannabinoider og især de flygtige terpener er følsomme molekyler, og måden du opbevarer dem på, afgør hvor længe produktet smager, dufter og opfører sig som tiltænkt.

## De fire fjender

Næsten al nedbrydning kan føres tilbage til fire faktorer. Kender du dem, kan du beskytte dig mod dem.

- Lys: UV-stråling nedbryder cannabinoider. Klare glas i vindueskarmen er det værste sted, et produkt kan stå.
- Varme: Høje temperaturer får terpenerne til at fordampe og fremskynder oxidation. Duften er det første, der forsvinder.
- Ilt: Luft oxiderer indholdsstofferne over tid. THC omdannes for eksempel langsomt til CBN, når det udsættes for ilt.
- Fugt: For meget fugt giver risiko for skimmel i plantemateriale, for lidt gør blomster sprøde og støvede.

## Olier og dråber

Olier holder sig bedst i den originale mørke glasflaske med låget skruet godt til. Et skab væk fra komfur, radiator og direkte sol er ideelt. Mange vælger køleskabet, hvilket er fint, men olien kan blive tykkere og uklar. Det er ikke et tegn på fejl, og den bliver klar igen ved stuetemperatur. Undgå at røre pipetten mod munden, så der ikke kommer bakterier tilbage i flasken.

## Blomster og plantemateriale

Tørret hamp opbevares bedst i lufttætte glasbeholdere i mørke og ved stuetemperatur, gerne mellem 15 og 21 grader. Plastikposer frarådes, fordi statisk elektricitet kan trække de små harpikskirtler, trikomerne, af plantematerialet. Fryseren er heller ikke en god idé: trikomerne bliver skøre og knækker let af, når materialet tøs op igen.

Den relative luftfugtighed i beholderen bør ligge omkring 55 til 62 procent. Små fugtregulerende poser, som sælges til netop dette formål, gør det let at holde niveauet stabilt.

## Salver og kosmetik

Topiske produkter følger samme principper som almindelig hudpleje: tør, kølig og mørk opbevaring, og låg på efter brug. Brug en ren spatel frem for fingrene, hvis produktet står i en åben krukke.

## Sikkerhed i hjemmet

Opbevar altid hampeprodukter utilgængeligt for børn og kæledyr, og helst i den originale emballage med etiket og batchnummer. Så kan du altid finde analysecertifikatet frem igen, hvis du er i tvivl om indholdet.

## Hvor længe holder det?

Holdbarheden står på emballagen og forudsætter korrekt opbevaring. Har et produkt ændret farve markant, lugter harskt eller viser tegn på skimmel, skal det kasseres. Et produkt, der blot har mistet lidt af sin duft, er som regel ikke farligt, men har ikke længere den profil, det blev skabt med.$b$,
  'Redaktionen',
  ARRAY['guide', 'guide-brug', 'opbevaring'],
  $j$[{"title": "Inspiration: How to properly store medical cannabis (Cannigma)", "url": "https://cannigma.com/products/how-to-properly-store-medical-cannabis-to-preserve-its-flavour-and-potency/"}]$j$::jsonb,
  'pending_review', 'complete', 80
),

-- ── BRUG 2: Decarboxylering ─────────────────────────────────────────────────
(
  'hvad-er-decarboxylering',
  'Hvad er decarboxylering? Kemien bag syreformerne i hamp',
  'Den levende hampeplante indeholder næsten ingen CBD eller THC, men deres syreformer CBDA og THCA. Her er forklaringen på, hvad der sker, når plantestofferne opvarmes.',
  $b$Hvis du læser et analysecertifikat fra et hampeprodukt, vil du ofte se to versioner af det samme stof: CBD og CBDA, THC og THCA. Forskellen skyldes en kemisk proces, der hedder decarboxylering, og den er nøglen til at forstå, hvad du faktisk har i hånden.

## Planten laver syrer, ikke CBD

Den levende hampeplante danner sine cannabinoider i syreform. Udgangspunktet er stoffet CBGA, som planten omdanner til blandt andet CBDA og THCA. Bogstavet A står for acid, syre, og betyder at molekylet bærer en ekstra carboxylgruppe, et lille kulstof-ilt-brint-anhæng.

Syreformerne opfører sig anderledes end de neutrale former. De har en anden molekylær form og binder sig anderledes i kroppen, og derfor skelner både forskere og myndigheder skarpt mellem dem.

## Hvad sker der ved opvarmning?

Når plantematerialet opvarmes, slipper carboxylgruppen og forsvinder som kuldioxid. Tilbage står den neutrale form:

- CBDA bliver til CBD
- THCA bliver til THC
- CBGA bliver til CBG

Processen sker hurtigt ved høj varme og meget langsomt ved stuetemperatur over måneder. Derfor kan et gammelt produkt have en lidt anden sammensætning end et nyt.

## Hvorfor betyder det noget for dig?

De fleste CBD-olier på markedet er fremstillet af ekstrakt, der er opvarmet under produktionen, så indholdet primært er CBD. Andre producenter laver bevidst rå olier, hvor syreformen CBDA er bevaret. Ingen af delene er bedre i sig selv, men det er to forskellige produkter, og det bør fremgå tydeligt af etiketten.

## Det juridiske perspektiv

Decarboxylering er også grunden til, at THCA kræver særlig opmærksomhed. THCA er ikke i sig selv euforiserende, men omdannes til THC ved opvarmning, og THC er et euforiserende stof, der er reguleret strengt i Danmark. Myndighederne vurderer derfor ofte produktets samlede THC-potentiale, altså THC plus det THC, som THCA kan blive til.

Vores råd er enkelt: køb kun produkter med et uafhængigt analysecertifikat, der angiver både THC og THCA, og følg altid gældende dansk lovgivning. Er du i tvivl, så kontakt Lægemiddelstyrelsen.

## Kort fortalt

Decarboxylering er ikke magi, men simpel kemi: varme fjerner en lille molekylegruppe og forvandler syreformer til neutrale cannabinoider. At forstå processen gør dig til en mere oplyst forbruger, der kan læse en etiket kritisk.$b$,
  'Redaktionen',
  ARRAY['guide', 'guide-brug', 'videnskab'],
  $j$[{"title": "Inspiration: What is decarboxylation? (Cannigma)", "url": "https://cannigma.com/plant/what-is-decarboxylation/"}]$j$::jsonb,
  'pending_review', 'complete', 80
),

-- ── BRUG 3: Start lavt, gå langsomt ─────────────────────────────────────────
(
  'start-lavt-gaa-langsomt',
  'Start lavt, gå langsomt: en rolig tilgang til hampeprodukter',
  'Alle reagerer forskelligt. Princippet om at starte lavt og gå langsomt handler om tålmodighed, opmærksomhed og om at læse etiketten, før du gør noget som helst andet.',
  $b$I hampeverdenen går et enkelt princip igen: start lavt, gå langsomt. Det er ikke en doseringsanvisning, men en holdning. Den handler om at give dig selv tid til at lære et produkt at kende i stedet for at forvente et bestemt resultat fra første dag.

## Hvorfor reagerer vi forskelligt?

Kropsvægt, stofskifte, kost, søvn og hvad du ellers indtager, spiller alle ind på, hvordan du oplever et produkt. To personer kan bruge det samme produkt på samme måde og have helt forskellige oplevelser. Derfor findes der ikke et universelt rigtigt udgangspunkt.

## Læs etiketten først

Producentens anvisning er dit første og vigtigste referencepunkt. En seriøs etiket fortæller:

- Hvor meget cannabinoid der er pr. dråbe, kapsel eller portion
- Hvilken type ekstrakt der er tale om: fuldspektrum, bredspektrum eller isolat
- Batchnummer og henvisning til analysecertifikat
- Anbefalet anvendelse og maksimal daglig mængde

Overskrid aldrig producentens anbefalinger, og vær skeptisk over for produkter uden tydelig mærkning.

## Tid er en del af oplevelsen

Indtagelsesformen bestemmer, hvor hurtigt et produkt mærkes. Inhalation via vaporizer mærkes typisk efter få minutter. Dråber under tungen tager længere tid, og kapsler eller andet, der skal gennem fordøjelsen, kan tage fra en halv til to timer. Den mest almindelige fejl er utålmodighed: man tager mere, før den første portion har nået at virke.

## Én ændring ad gangen

Skift ikke produkt, mængde og tidspunkt på samme tid. Ændrer du kun én ting ad gangen, kan du faktisk se, hvad der gør en forskel. Mange har glæde af at føre en lille logbog med produkt, mængde, tidspunkt og egne observationer.

## Hvornår du skal tale med en fagperson

Cannabinoider omsættes i leveren af de samme enzymer, som nedbryder mange typer medicin. Tager du receptpligtig medicin, så tal med din læge eller dit apotek, før du begynder at bruge hampeprodukter. Det samme gælder, hvis du er gravid eller ammer, i hvilket fald brug generelt frarådes.

## Ansvarlig brug

- Kør ikke bil eller betjen maskiner, før du kender din egen reaktion på et produkt.
- Kombinér ikke med alkohol.
- Produkterne er kun til voksne over 18 år.

Vores produkter er ikke lægemidler og er ikke beregnet til at diagnosticere, behandle, helbrede eller forebygge sygdom.$b$,
  'Redaktionen',
  ARRAY['guide', 'guide-brug', 'ansvarlighed'],
  $j$[{"title": "Inspiration: How to dose marijuana (Cannigma)", "url": "https://cannigma.com/treatment/how-to-dose-marijuana/"}, {"title": "Inspiration: How to mitigate the side effects of cannabis (Cannigma)", "url": "https://cannigma.com/treatment/how-to-mitigate-the-side-effects-of-cannabis/"}]$j$::jsonb,
  'pending_review', 'complete', 80
),

-- ── BRUG 4: Ordbog ──────────────────────────────────────────────────────────
(
  'hampens-ordbog',
  'Hampens ordbog: fra CBD til terpener',
  'Fuldspektrum, isolat, CoA, trikomer. Hampeverdenen har sit eget sprog. Her er de vigtigste begreber forklaret kort og uden omsvøb.',
  $b$Hampeverdenen er fuld af fagudtryk, forkortelser og lånte engelske ord. Denne ordbog samler de begreber, du oftest støder på i etiketter, analysecertifikater og artikler her på weeds.dk.

## Cannabinoider

Cannabinoider er en gruppe kemiske forbindelser, som hampeplanten danner. Over hundrede er identificeret, men kun få findes i større mængder.

- CBD (cannabidiol): Den mest kendte ikke-euforiserende cannabinoid i industrihamp.
- CBDA: Syreformen af CBD, som findes i den rå plante.
- THC (tetrahydrocannabinol): Den euforiserende cannabinoid. Strengt reguleret i Danmark.
- THCA: Syreformen af THC. Omdannes til THC ved opvarmning.
- CBG (cannabigerol): Forstadiet, som planten danner de øvrige cannabinoider ud fra.
- CBN (cannabinol): Opstår, når THC nedbrydes af ilt og lys over tid.

## Terpener

Terpener er de aromatiske stoffer, der giver planter deres duft. De findes også i citrus, fyrretræ, lavendel og peber.

- Myrcen: Jordagtig, urteagtig duft. Findes også i humle og mango.
- Limonen: Frisk citrusduft.
- Linalool: Blomstret duft, kendt fra lavendel.
- Pinen: Duften af nåletræ.
- Karyofyllen: Krydret og peberagtig.

## Ekstrakttyper

- Fuldspektrum: Indeholder plantens naturlige spektrum af cannabinoider, terpener og andre plantestoffer.
- Bredspektrum: Som fuldspektrum, men med THC fjernet.
- Isolat: Et enkelt cannabinoid, typisk CBD, i ren form uden andre plantestoffer.
- Entourage-effekt: Hypotesen om, at plantens stoffer virker anderledes sammen end hver for sig. Forskningen er endnu ikke entydig.

## Plante og produktion

- Industrihamp: Hampesorter godkendt i EU med et meget lavt indhold af THC.
- Trikomer: De små harpikskirtler på blomsten, hvor cannabinoider og terpener dannes.
- Bæreolie: Den olie, ekstraktet opløses i, ofte MCT-olie fra kokos eller hampefrøolie.
- Decarboxylering: Den proces, hvor varme omdanner syreformer som CBDA til neutrale former som CBD.

## Kvalitet og regulering

- CoA (Certificate of Analysis): Analysecertifikat fra et laboratorium, der dokumenterer et produkts indhold af cannabinoider og fravær af forureninger.
- Batchnummer: Produktionsnummeret, der forbinder et produkt med dets analysecertifikat.
- Novel food: EU-betegnelsen for nye fødevarer, som kræver godkendelse, før de må sælges. CBD i fødevarer falder ind under denne kategori.

Mangler du et begreb? Skriv til os, så udvider vi ordbogen.$b$,
  'Redaktionen',
  ARRAY['guide', 'guide-brug', 'ordbog'],
  $j$[{"title": "Inspiration: How-to guides (Cannigma)", "url": "https://cannigma.com/how-to/"}]$j$::jsonb,
  'pending_review', 'complete', 75
),

-- ── INDTAG 1: Vaporizer ─────────────────────────────────────────────────────
(
  'saadan-bruger-du-en-vaporizer',
  'Sådan bruger du en vaporizer til tørret hamp',
  'En vaporizer opvarmer plantematerialet uden at brænde det. Her er forskellen på typerne, betydningen af temperatur, og hvordan du holder apparatet rent.',
  $b$En vaporizer opvarmer tørret plantemateriale til en temperatur, hvor de aktive stoffer og terpenerne fordamper, men hvor materialet ikke brænder. Resultatet er en damp i stedet for røg. Denne guide gennemgår de grundlæggende principper for brug af en vaporizer til lovlig industrihamp.

## Damp i stedet for røg

Forbrænding begynder omkring 230 grader. Ved afbrænding dannes tjære, kulilte og en lang række forbrændingsprodukter. En vaporizer arbejder typisk mellem 160 og 220 grader, under forbrændingspunktet. Det betyder ikke, at inhalation er risikofri, men at selve forbrændingen undgås.

## To typer opvarmning

- Konduktion: Materialet ligger direkte på en varm overflade, lidt som en pande. Hurtig opvarmning, men kræver at materialet røres rundt for jævn fordampning.
- Konvektion: Varm luft strømmer gennem materialet, lidt som en varmluftsovn. Mere jævn opvarmning og ofte en mere nuanceret smag, men apparaterne er typisk dyrere.

## Temperatur og smag

Forskellige stoffer fordamper ved forskellige temperaturer. Mange af de lette terpener frigives allerede i den lave ende, mens cannabinoiderne kræver mere varme. Derfor vælger mange at begynde lavt og hæve temperaturen gradvist i løbet af en session. Lave temperaturer giver mest smag og en mildere damp. Høje temperaturer giver tættere damp, men smagen bliver mere ristet.

## Trin for trin

- Kværn materialet til en jævn, mellemgrov konsistens. For fint pulver kan stoppe luftstrømmen.
- Fyld kammeret uden at presse materialet hårdt sammen, så luften kan passere.
- Vælg en lav starttemperatur og lad apparatet varme op.
- Træk langsomt og roligt. Hurtige, kraftige drag giver ikke mere damp.
- Hæv eventuelt temperaturen gradvist.
- Tøm kammeret, når materialet er brunt. Det brugte materiale kaldes ofte AVB, already vaped bud.

## Rengøring

En ren vaporizer smager bedre og fungerer bedre. Børst kammeret efter hver brug, og rens mundstykke og luftveje jævnligt med isopropylalkohol og vatpinde. Lad alle dele tørre helt, før apparatet samles igen. Følg altid producentens vejledning.

## Vigtigt at vide

- Brug kun tørret plantemateriale med dokumenteret indhold og analysecertifikat.
- Undgå uregulerede væsker og patroner fra ukendte kilder. Elektroniske cigaretter og væsker er i Danmark reguleret af særlig lovgivning.
- Inhalation er ikke for alle. Har du luftvejsproblemer, så vælg en anden indtagelsesform.
- Kun for voksne over 18 år.$b$,
  'Redaktionen',
  ARRAY['guide', 'guide-indtag', 'vaporizer'],
  $j$[{"title": "Inspiration: How to use a weed vaporizer (Cannigma)", "url": "https://cannigma.com/products/how-to-use-a-weed-vaporizer/"}]$j$::jsonb,
  'pending_review', 'complete', 80
),

-- ── INDTAG 2: Røgfri alternativer ───────────────────────────────────────────
(
  'roegfri-maader-at-bruge-hamp',
  'Røgfri måder at bruge hamp på',
  'Olier, kapsler, salver og vaporizere. Der findes mange måder at bruge hampeprodukter på uden røg. Her er et overblik over formerne, og hvordan de adskiller sig.',
  $b$Røg er ikke en forudsætning for at bruge hamp. Tværtimod vælger flere og flere indtagelsesformer, hvor der ikke sker forbrænding. Formen påvirker, hvor hurtigt et produkt mærkes, hvor længe oplevelsen varer, og hvor præcist du kan styre mængden.

## Olier og dråber

Den mest udbredte form. Ekstraktet er opløst i en bæreolie og doseres med pipette. Mange lægger dråberne under tungen og holder dem der et minut, før de synker. Dråber giver god kontrol over mængden, og effekten indtræder typisk inden for en halv til en hel time.

## Kapsler

Kapsler indeholder en fast, forudbestemt mængde og er diskrete og smagsneutrale. Fordi indholdet skal gennem fordøjelsen, mærkes det senere end dråber, ofte efter en til to timer, og oplevelsen varer til gengæld længere.

## Salver og cremer

Topiske produkter påføres huden og bruges som en del af en hudplejerutine eller massage. De optages lokalt i huden og når ikke blodbanen i nævneværdig grad. Kosmetiske produkter er reguleret af EU's kosmetikforordning.

## Vaporizer

En vaporizer opvarmer tørret plantemateriale uden at brænde det. Dampen mærkes hurtigt, typisk efter få minutter, men varer kortere. Inhalation er dog stadig inhalation, og formen passer ikke til alle. Læs vores guide til vaporizere for flere detaljer.

## Te af hampeblade

Te af tørrede hampeblade er en gammel tradition. Fordi cannabinoider er fedtopløselige, opløses de dårligt i vand, så en te giver primært smag og ritual. Lidt fløde eller mælk øger opløseligheden.

## Fødevarer og drikke

Du vil måske støde på slik, chokolade eller drikke med CBD fra udlandet. Vær opmærksom på, at CBD i fødevarer er omfattet af EU's regler om novel food og endnu ikke er godkendt. Sådanne produkter må derfor ikke markedsføres som fødevarer i Danmark. Spiselige produkter er desuden de sværeste at dosere, fordi virkningen kommer sent og varer længe.

## Overblik

- Hurtigst: vaporizer, efter få minutter.
- Mellem: dråber under tungen, efter en halv til en hel time.
- Langsomst og længst: kapsler, efter en til to timer.
- Lokalt: salver og cremer på huden.

Uanset hvilken form du vælger, gælder det samme princip: start lavt, gå langsomt, og vælg kun produkter med et uafhængigt analysecertifikat.$b$,
  'Redaktionen',
  ARRAY['guide', 'guide-indtag', 'roegfri'],
  $j$[{"title": "Inspiration: 7 ways to consume cannabis without smoking (Cannigma)", "url": "https://cannigma.com/products/7-ways-to-consume-cannabis-without-smoking/"}]$j$::jsonb,
  'pending_review', 'complete', 80
)

ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
SELECT 'Migration v2.6 completed — 6 guide drafts queued for review' AS status;


import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privatlivspolitik — weeds.dk",
  description:
    "Privatlivspolitik for weeds.dk: hvilke personoplysninger vi indsamler, formål, behandlingsgrundlag, cookies og dine rettigheder efter GDPR.",
};

const controllerName = "weeds.dk";
const controllerAddress = "Roskilde";
const controllerPerson = "Tue Andersen";
const controllerEmail = "kontakt@weeds.dk";
const controllerPhone = "20373387";

export default function Privatlivspolitik() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-light text-[#2D3748] mb-2">Privatlivspolitik</h1>
      <p className="text-sm text-[#718096] mb-10">Senest opdateret: 20. oktober 2026</p>

      <div className="space-y-10 text-[#4A5568] leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-medium text-[#2D3748] mb-3">1. Dataansvarlig</h2>
          <p>
            Vi er dataansvarlige for behandlingen af de personoplysninger, vi har modtaget om dig.
            Du finder vores kontaktoplysninger nedenfor.
          </p>
          <address className="not-italic mt-3 space-y-1">
            <p>{controllerName}</p>
            <p>{controllerAddress}</p>
            <p>v/ {controllerPerson}</p>
            <p>E-mail: {controllerEmail}</p>
            <p>Telefon: {controllerPhone}</p>
          </address>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#2D3748] mb-3">2. Hvilke personoplysninger indsamler vi?</h2>
          <p>Vi behandler følgende kategorier af personoplysninger om dig:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Ordre- og kontaktoplysninger:</strong> navn, adresse, e-mailadresse og
              telefonnummer, når du afgiver en bestilling eller opretter dig som medlem.
            </li>
            <li>
              <strong>Betalingsoplysninger:</strong> behandles af vores betalingsudbydere
              (QuickPay og Mollie). Vi modtager og opbevarer ikke dine kortoplysninger.
            </li>
            <li>
              <strong>Tekniske oplysninger:</strong> sider du besøger samt klik på udvalgte
              elementer, registreret som anonymiseret førstepartsstatistik uden brug af
              cookies.
            </li>
            <li>
              <strong>Kampagne- og henvisningsoplysninger:</strong> UTM-parametre og
              henvisningskilder, når du har givet samtykke.
            </li>
            <li>
              <strong>Medlemsoplysninger:</strong> oplysninger knyttet til dit medlemskab af
              andelsforeningen/cooperativet.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#2D3748] mb-3">3. Formål og behandlingsgrundlag</h2>
          <p>Vi behandler dine personoplysninger til følgende formål og på følgende grundlag:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Gennemførelse af køb og medlemskab</strong> — opfyldelse af kontrakt,
              jf. GDPR art. 6, stk. 1, litra b.
            </li>
            <li>
              <strong>Opbevaring af regnskabsoplysninger</strong> — retlig forpligtelse efter
              bogføringsloven, jf. GDPR art. 6, stk. 1, litra c.
            </li>
            <li>
              <strong>Statistik og forbedring af hjemmesiden</strong> — anonymiseret
              førstepartsstatistik uden brug af cookies og uden videregivelse til tredjepart,
              jf. GDPR art. 6, stk. 1, litra f (berettiget interesse).
            </li>
            <li>
              <strong>Måling af markedsføring og henvisninger (attribution)</strong> — dit
              samtykke, jf. GDPR art. 6, stk. 1, litra a.
            </li>
            <li>
              <strong>Nødvendige tekniske cookies</strong> (fx sprog-/landeindstillinger) —
              berettiget interesse i at levere en fungerende hjemmeside, jf. GDPR art. 6,
              stk. 1, litra f.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#2D3748] mb-3">4. Cookies</h2>
          <p>
            Når du besøger weeds.dk første gang, vises et samtykkebanner.
            Markedsføringscookies (attribution) aktiveres først, når du har klikket
            »Accept«. Du kan altid
            tilbagetrække dit samtykke ved at slette cookies fra weeds.dk i din browser og
            dernæst klikke »Afvis« i banneret.
          </p>
          <table className="w-full mt-4 text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="py-2 pr-4 font-medium text-[#2D3748]">Cookie</th>
                <th className="py-2 pr-4 font-medium text-[#2D3748]">Formål</th>
                <th className="py-2 font-medium text-[#2D3748]">Levetid</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-[#E2E8F0]">
                <td className="py-2 pr-4">x-country-code</td>
                <td className="py-2 pr-4">Nødvendig — husker landeindstillinger</td>
                <td className="py-2">24 timer</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="py-2 pr-4">weeds_consent_marketing</td>
                <td className="py-2 pr-4">Nødvendig — husker dit cookiesamtykke</td>
                <td className="py-2">30 dage</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="py-2 pr-4">wsc_active</td>
                <td className="py-2 pr-4">Nødvendig — sessionsmarkør uden indhold; bruges til anonym sessionsoptælling pr. side</td>
                <td className="py-2">10 minutter</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="py-2 pr-4">weeds_ref_id, weeds_session_id, attr_*</td>
                <td className="py-2 pr-4">Attribution — måling af kampagner (kræver samtykke)</td>
                <td className="py-2">30 dage</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#2D3748] mb-3">5. Modtagere af dine oplysninger</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Betalingsudbydere (QuickPay, Mollie):</strong> databehandlere i EU/EØS,
              der gennemfører betalingstransaktioner.
            </li>
            <li>
              <strong>Hostingudbyder:</strong> vores hostingplatform behandler data i EU/EØS
              eller i lande med tilstrækkeligt beskyttelsesniveau.
            </li>
          </ul>
          <p className="mt-2">
            Vi videregiver aldrig dine personoplysninger til tredjepart til deres eget brug,
            medmindre du har givet samtykke hertil.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#2D3748] mb-3">6. Opbevaring</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Regnskabsoplysninger opbevares i 5 år efter regnskabsårets udløb, jf.
              bogføringsloven.
            </li>
            <li>Førstepartsstatistik opbevares i anonymiseret form uden tidsfrist.</li>
            <li>Attributiondata opbevares i op til 30 dage.</li>
            <li>
              Medlemsoplysninger opbevares, så længe dit medlemskab er aktivt, og derefter
              efter gældende lovkrav.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#2D3748] mb-3">7. Dine rettigheder</h2>
          <p>Du har efter GDPR bl.a. følgende rettigheder:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Ret til indsigt i de oplysninger, vi behandler om dig.</li>
            <li>Ret til berigtigelse (rettelse) af urigtige oplysninger.</li>
            <li>Ret til sletning (»retten til at blive glemt«).</li>
            <li>Ret til begrænsning af behandlingen.</li>
            <li>Ret til dataportabilitet.</li>
            <li>Ret til at gøre indsigelse mod behandlingen.</li>
            <li>
              Ret til at tilbagetrække dit samtykke til enhver tid — med virkning for
              fremtiden.
            </li>
          </ul>
          <p className="mt-2">
            Hvis du vil gøre brug af dine rettigheder, kan du kontakte os på {controllerEmail}.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#2D3748] mb-3">8. Klage til Datatilsynet</h2>
          <p>
            Du har ret til at indgive en klage over vores behandling af personoplysninger til
            Datatilsynet:
          </p>
          <address className="not-italic mt-3 space-y-1">
            <p>Datatilsynet</p>
            <p>Carl Jacobsens Vej 35</p>
            <p>2500 Valby</p>
            <p>Telefon: 33 19 32 00</p>
            <p>E-mail: dt@datatilsynet.dk</p>
            <p>Hjemmeside: www.datatilsynet.dk</p>
          </address>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[#2D3748] mb-3">9. Ændringer i denne privatlivspolitik</h2>
          <p>
            Denne privatlivspolitik ændres og opdateres, når det er nødvendigt, fx som følge
            af lovændringer eller ændringer i vores behandling af personoplysninger.
            Væsentlige ændringer vil blive varslet tydeligt på websitet.
          </p>
        </section>
      </div>
    </article>
  );
}

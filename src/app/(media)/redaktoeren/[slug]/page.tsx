import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface EditorialArticle {
  slug: string;
  category: string;
  title: string;
  subtitle: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  readingTime: string;
  heroImageUrl: string;
  content: {
    lead: string;
    sections: {
      heading?: string;
      paragraphs: string[];
      quote?: string;
    }[];
    closingQuestion: string;
  };
}

const ARTICLES: Record<string, EditorialArticle> = {
  peterovigknudsen: {
    slug: 'peterovigknudsen',
    category: 'Bio over danske cannabis-legender',
    title: 'Hvad jeg ved om Peter',
    subtitle: 'Om Peter Øvig Knudsens 45 års pot-rygning, samtalen om forbrug versus misbrug, og spørgsmålet vi mangler at stille.',
    author: 'Redaktøren',
    authorRole: 'weeds.dk',
    publishedAt: '10. november 2026',
    readingTime: '5 min læsning',
    heroImageUrl: '/images/articles/peterovigknudsen.jpg',
    content: {
      lead: 'Peter Øvig Knudsen er en kendt forfatter. Jeg har læst og hørt nogle af hans bøger, men købte først for alvor hans bog, da han udgav »Øvigs lille bog om pot« i 2025. Den købte jeg også som gave. Den er læseværdig – selvom jeg personligt havde håbet på flere gode cannabis-røverhistorier.',
      sections: [
        {
          heading: 'Bogen, Radio4 og det evige fokus på psykoser',
          paragraphs: [
            'Nuvel, bogen handler om Peters 45 års cannabis-rygning. Den handler om Peters omgang med cannabis i de forskellige faser af Peters liv. Og så handler bogen (for meget) om psykoser.',
            'Som en af opfølgningerne på bogen har Peter været gæstevært hos Radio4 i programmet »Ta’r jeg fejl?« – igen med udgangspunkt i bogen. Her sidder Peter overfor modstandere af en afkriminalisering. Og han gør det godt. De fleste argumenter Peter bliver mødt med er velkendte, og det er dem med misbrug eller overforbrug. Ellers er det synsninger, som ikke har hold i virkeligheden.',
            'Den store pointe eller diskussion, som jeg synes mangler i bogen, er den samtale om forbrug versus misbrug. Samtalen er til stede, men det er ligesom om, at fortællingen om forbrug versus misbrug blot er et appendix.',
          ],
          quote: 'Hver gang en samtale om cannabis bliver løftet hen et sted, hvor der er fokus på planten i offentligheden, så er alt, der bliver bragt til bordet, samtaler om overforbrug og misbrug.',
        },
        {
          heading: 'Når 50% har prøvet det, hvorfor taler vi så kun om de få?',
          paragraphs: [
            'Jo, men kan du ikke bare begynde at tale om forbrug versus misbrug? Det bør da være enkelt. Ja, det har du da ret i – virkeligheden er bare en helt anden. Hver gang en samtale om cannabis bliver løftet hen et sted, hvor der er fokus på planten i offentligheden, så er alt som bliver bragt til bordet samtaler om overforbrug og misbrug. Og lige så snart en eller anden politiker eller psykolog bliver spurgt, så er svaret noget med unges apati og potentielle misbrug.',
            'Men når vi ved, at mere end 50% af befolkningen har prøvet cannabis/hash, så er det da mærkeligt, at de offentlige samtaler kun kan handle om de få tilfælde, der handler om psykose og sløvsind.',
            'Uden at være lægefagligt kompetent til at komme med en klinisk vurdering, så vil jeg i øvrigt mene, at når der opstår en psykose, så vil potentialet for denne psykose have været til stede langt tidligere i det enkelte menneske. Det er muligt, at en joint gør, at mennesket for første gang bliver i stand til at åbne sig så meget via en joint, at hjernen bliver kortsluttet, og dermed opstår psykosen.',
            'Uagtet rigtigheden i ovenstående om psykosens væsen, så er Peters argument gennem hele bogen – at en stille og rolig afkriminalisering og tilladelse til at dyrke sin egen cannabis hjemme i haven er et ønske og en holdning, alle os med et nydelsesforbrug sætter stor pris på.',
          ],
        },
        {
          heading: 'Nydelsen, doseringen og forskellen på »høj« og »stenet«',
          paragraphs: [
            'Nydelsen ved rusen af cannabis, doseret i den helt rigtige mængde, er uovertruffen. Du kan indtage cannabis på mange måder og i mange former. Du kan sørge for, at rusen sker med det samme ved rygning, eller du kan vælge at indtage spiselig cannabis, hvorved du skal afvente rusen. Ved rygning kommer dit peak hurtigere end ved indtagelse ved spisning. Ved spisning vokser din »høj« over tid. Det kræver også, at du eksperimenterer med indtagelsen ved spisning. For ved at spise for meget, opstår risikoen for, at du får for meget. Og for meget kan gøre dig paranoid og give dig hjertebanken. Ingen af delene er særlig sjove. Disse yderpunkter beskrives også så flot i bogen.',
            'Men hvad er egentlig forskellen på »høj« og »stenet« – eller »high« and »stoned«? For man er jo skæv uanset hvad, ikke?',
            'Nu skriver jeg til dem, som ikke har indtaget cannabis i nogen form før, eller som måske har prøvet en enkelt gang, da de var unge, og ikke har gjort det siden. At være »høj« betyder jo, som ordet siger, at man er højere, er større, at man har det bedre. Og det er uanset om man er alene eller i et fællesskab. Man kommer tættere på sig selv og de andre, man er sammen med. Festen bliver mere nærværende, og indrømmet: nogle gange foregår tingene langsommere. Men det er også dejligt.',
            'Hvordan kan det egentlig også være, at mange, som har en negativ holdning til cannabis, påstår, at de aldrig selv har indtaget stoffet? Hvordan kan du udtale dig om, hvorvidt et stof skal være ulovligt, hvis du omtaler et stof, som 40–50% af befolkningen har prøvet, og hvor de fleste mener, at det skal gøres lovligt i en eller anden form? Hvordan kan du udtale dig som politiker på den baggrund?',
            'Hvis du mener, det er fordi det altid har været sådan, så kan man jo sige, at det har det ikke altid været. Danmark gjorde stoffet ulovligt i 1961 som en ekspeditionssag fra FN. FN gjorde det ulovligt på baggrund af et forbud i USA, som udover sine racistiske motiver, var skabt af Harry Anslinger.',
          ],
          quote: 'At være »høj« betyder jo, som ordet siger, at man er højere, er større, at man har det bedre. Festen bliver mere nærværende. Nogle gange foregår tingene langsommere. Men det er også dejligt.',
        },
        {
          heading: 'Hvor høj kan man blive? Singulariteten og den kolde verden',
          paragraphs: [
            '»Stenet« er igen en subjektiv oplevelse. Lige i starten af min karriere med cannabis røg vi en bong. De andre grinede, da jeg efter et par timer sagde et par ord. Jeg spurgte sikkert, om jeg kunne få lidt at drikke. Så er man for stenet. Jeg foretrækker klart at være høj, for der er en stenet bonus til sidst. Men at være stenet kan altså også noget: Den afslappede følelse, hvor du bare sidder og observerer, eller hvor du simpelthen falder i søvn i den dejligste og mest afslappede søvn, du nogensinde har oplevet.',
            'Tilbage til »høj«. Jeg er klar over, at du på en måde sætter tempoet i hjernen ned. Jeg tror, det er rigtig sundt at gøre det. Kunsten er, at du skal finde dit niveau. Og alle mennesker er forskellige.',
            'Men rammer du det helt rigtige niveau, så opstår den »høje«. Den, hvor du tænker store tanker. Der, hvor din samhørighed med verden bliver større, og der, hvor du oplever, hvem du grundlæggende er. Ja, det kan da være en skræmmende følelse. Men igen: det er kun tanker. Du er i stand til at ændre dit tankemønster under en »høj« ved at gå udenfor, tage et bad, løbe en tur eller på en anden måde ændre din situation, hvis du gerne vil ændre på dit tankemønster. Du bliver også i stand til at lave ting, du normalt ikke gør, eller få dem defineret, så du senere kan overveje, om det var noget, som skete på grund af din høj, eller om den bragte dig et sted hen, hvor du blev i stand til at genopdage et gammelt ønske.',
            'Hvor høj kan man blive? Ja, hvis vi tager en psykose for gode varer, så kan man blive så høj, at du grundlæggende kan ændre personlighed. Men lad os blive på jorden. Du kan blive så høj, at du ser den universelle sandhed. Singulariteten. Enheden. Og når du har oplevet det, så virker den verden, vi lever i, dum og fattig. Den virker meningsløs og taberagtig. Den virker kold og kedelig. Det er den selvfølgelig ikke. Men alligevel: Vi lever i opsatte systemer, hvor den enkeltes initiativ ikke værdsættes, og hvor individets rigdom sjældent har mulighed for at komme til udtryk.',
            'Denne tekst er et forsøg på at demonstrere en utilfredshed med, hvordan vi har indrettet verden.',
            'Så er der nogen, som vil sige: er det ikke bare fordi, du mangler initiativ og er fantasiløs? Til dem vil jeg sige, at det er da skønt, hvis du synes, det er idealet af livet at møde ind på et kontor 7,5 timer hver dag. Arbejde med spændende projekter og skabe fremdrift for virksomheden. Men er det det, du helst vil? Om du er 25 eller 55 – er det det? Eller vil du hellere noget andet?',
            'Pointen er ikke, om det ene eller andet er det mest rigtige. Pointen er, at en høj kan skabe tanker hos dig, som gør dig i stand til at stille dig selv nogle spørgsmål, som du i en normal uge ikke vil stille dig selv.',
            'Så ender samtalen et sted, hvor det ikke bliver muligt at tale om cannabis som et væsentligt mindre farligt stof end alkohol.',
          ],
        },
      ],
      closingQuestion: 'Så mit spørgsmål til Peter er: Hvordan får vi løftet samtalen op til et sted, hvor vi kan adskille pointerne?',
    },
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES[slug.toLowerCase()];

  if (!article) return {};

  return {
    title: `${article.title} — ${article.category} | weeds.dk`,
    description: article.subtitle,
    openGraph: {
      title: `${article.title} | weeds.dk`,
      description: article.subtitle,
      images: [article.heroImageUrl],
    },
  };
}

export default async function RedaktoerenArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = ARTICLES[slug.toLowerCase()];

  if (!article) {
    notFound();
  }

  return (
    <article className="min-h-screen pb-24">
      {/* Top Breadcrumb & Section tag */}
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 text-xs text-[#718096] uppercase tracking-wider mb-4">
          <Link href="/redaktoeren" className="hover:text-[#2D3748] transition-colors">
            Redaktørens Side
          </Link>
          <span>/</span>
          <span className="text-[#6B8E6B] font-medium">{article.category}</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-light text-[#2D3748] leading-tight tracking-tight mb-4 font-serif">
          {article.title}
        </h1>

        <p className="text-xl text-[#718096] font-light leading-relaxed mb-6">
          {article.subtitle}
        </p>

        {/* Byline */}
        <div className="flex items-center gap-3 pt-6 border-t border-[#E2E8F0] text-xs text-[#718096]">
          <div className="w-9 h-9 rounded-full bg-[#2D3748] text-white flex items-center justify-center font-medium font-sans">
            R
          </div>
          <div>
            <p className="font-medium text-[#2D3748]">{article.author}</p>
            <p className="text-[11px] text-[#A0AEC0]">{article.authorRole} · {article.publishedAt} · {article.readingTime}</p>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <div className="aspect-[16/9] bg-[#F7F5F0] rounded-xl overflow-hidden shadow-sm border border-[#E2E8F0]">
          <img
            src={article.heroImageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-[11px] text-[#A0AEC0] mt-2 text-center italic">
          Portræt &amp; essay: Peter Øvig Knudsen og den danske cannabis-samtale.
        </p>
      </div>

      {/* Article Body */}
      <div className="max-w-3xl mx-auto px-6 font-serif text-[#2D3748]">
        {/* Lead paragraph */}
        <p className="text-xl md:text-2xl font-light leading-relaxed mb-10 text-[#2D3748] border-b border-[#E2E8F0] pb-8 italic">
          {article.content.lead}
        </p>

        {/* Sections */}
        {article.content.sections.map((section, idx) => (
          <section key={idx} className="mb-12">
            {section.heading && (
              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-[#2D3748] mt-10 mb-6 font-serif">
                {section.heading}
              </h2>
            )}

            <div className="space-y-6 text-lg leading-8 font-light text-[#4A5568]">
              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx}>{p}</p>
              ))}
            </div>

            {section.quote && (
              <blockquote className="my-8 p-6 bg-[#F7F5F0] border-l-4 border-[#9CAF88] rounded-r-lg">
                <p className="text-lg md:text-xl font-serif italic text-[#2D3748] leading-relaxed">
                  &quot;{section.quote}&quot;
                </p>
              </blockquote>
            )}
          </section>
        ))}

        {/* Closing Question / Climax */}
        <div className="my-12 p-8 bg-[#2D3748] text-white rounded-xl shadow-sm">
          <p className="text-xs uppercase tracking-widest text-[#9CAF88] mb-2 font-sans font-medium">
            Spørgsmålet til debatten
          </p>
          <p className="text-xl md:text-2xl font-light font-serif leading-snug">
            {article.content.closingQuestion}
          </p>
        </div>

        {/* Footnote / Bio notice */}
        <div className="pt-8 border-t border-[#E2E8F0] text-xs font-sans text-[#718096] space-y-2">
          <p className="font-semibold text-[#2D3748] uppercase tracking-wide">Om denne serie:</p>
          <p className="leading-relaxed">
            »Bio over danske cannabis-legender« er redaktørens personlige kommentarspor på weeds.dk. Teksterne afspejler redaktørens egne observationer, erfaringer og holdninger til samfundets indretning og samtalen om rusmidler i Danmark.
          </p>
        </div>
      </div>
    </article>
  );
}

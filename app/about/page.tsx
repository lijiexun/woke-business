import type { Metadata } from "next";
import Link from "next/link";
import { journalFullName } from "@/lib/journals";

export const metadata: Metadata = {
  title: "About | Woke Business",
  description: "Project background, methodology, and limitations for Woke Business."
};

const journalLinks: Record<string, string> = {
  AMJ: "https://journals.aom.org/journal/amj",
  AMR: "https://journals.aom.org/journal/amr",
  ASQ: "https://journals.sagepub.com/home/asq",
  ISR: "https://pubsonline.informs.org/journal/isre",
  JAE: "https://www.sciencedirect.com/journal/journal-of-accounting-and-economics",
  JAR: "https://onlinelibrary.wiley.com/journal/1475679X",
  JCR: "https://academic.oup.com/jcr",
  JF: "https://onlinelibrary.wiley.com/journal/15406261",
  JFE: "https://www.sciencedirect.com/journal/journal-of-financial-economics",
  JIBS: "https://www.jibs.net/",
  JM: "https://journals.sagepub.com/home/jmx",
  JMR: "https://journals.sagepub.com/home/mrj",
  JOC: "https://pubsonline.informs.org/journal/ijoc",
  JOM: "https://onlinelibrary.wiley.com/journal/18731317",
  MISQ: "https://misq.umn.edu/",
  MKS: "https://pubsonline.informs.org/journal/mksc",
  MS: "https://pubsonline.informs.org/journal/mnsc",
  MSOM: "https://pubsonline.informs.org/journal/msom",
  OR: "https://pubsonline.informs.org/journal/opre",
  OS: "https://pubsonline.informs.org/journal/orsc",
  POM: "https://onlinelibrary.wiley.com/journal/19375956",
  RFS: "https://academic.oup.com/rfs",
  SMJ: "https://sms.onlinelibrary.wiley.com/journal/10970266",
  TAR: "https://publications.aaahq.org/accounting-review"
};

const journalsByDiscipline: Array<{ discipline: string; journals: string[] }> = [
  { discipline: "Accounting", journals: ["JAE", "JAR", "TAR"] },
  { discipline: "Finance", journals: ["JF", "JFE", "RFS"] },
  { discipline: "Information Systems", journals: ["ISR", "JOC", "MISQ"] },
  { discipline: "Management & Organizations", journals: ["AMJ", "AMR", "ASQ", "JIBS", "OS", "SMJ"] },
  { discipline: "Marketing", journals: ["JCR", "JM", "JMR", "MKS"] },
  { discipline: "Multidisciplinary", journals: ["MS", "OR"] },
  { discipline: "Operations Management", journals: ["JOM", "MSOM", "POM"] }
];

const featureCards = [
  {
    title: "Overview",
    text: "The main trend chart plots yearly mean woke score and a 95% interval, with optional smoothing (none, 3-year, or 5-year moving average)."
  },
  {
    title: "Journal and Discipline Trends",
    text: "Compare lines across journals or disciplines, and toggle raw values versus within-journal/within-discipline z-scores."
  },
  {
    title: "Author + Journal Drilldowns",
    text: "Inspect author-level mean rankings, click into paper-level details, and review journal-internal rankings with abstract and score explanations."
  },
  {
    title: "Keyword Lens",
    text: "Use one global word cloud and keyword-over-time bars with raw/per-1k toggle; clicking a year applies a year filter."
  }
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-[1600px] p-4">
      <section className="panel mb-4 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-slate-900">About Woke Business</h1>
          <Link href="/" className="btn-secondary">
            Back to Dashboard
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
          <p className="text-sm leading-6 text-slate-700">
            The term <strong>&quot;woke&quot;</strong> has spent the last decade evolving from social-awareness shorthand into a
            full-contact political keyword. One side frames it as overdue attention to bias, exclusion, and institutional
            blind spots. The other side sees it as ideological mission creep that repackages activism as expertise. Both
            sides, naturally, are convinced they alone are defending reality.
          </p>
          <div className="rounded-xl border border-slate-200 bg-white/75 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Focus</div>
            <div className="mt-1 text-sm text-slate-700">
              Quantify how these themes appear in <strong>business scholarship</strong>, then let users inspect patterns rather
              than just trade slogans.
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="section-title mb-3">Why &quot;Woke Business&quot;?</h2>
          <p className="mb-3 text-sm leading-6 text-slate-700">
            Academia has its own version of the same argument: are business schools expanding responsibly into social
            context, or drifting from economic analysis into moral grandstanding? This project does not settle that debate.
            It measures text-level signals in published business research so the argument can at least reference data before
            it references outrage.
          </p>
        </section>

        <section className="panel p-5">
          <h2 className="section-title mb-3">Dataset Scope</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>
              <span className="font-semibold text-slate-900">Coverage:</span> <strong>40,000+</strong> UTD-24 business journal
              articles.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Time window:</span> 2000-2024.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Core inputs:</span> title, abstract, journal, discipline label,
              and URL.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Scored outputs:</span> `woke_score` (1-10), supporting keywords,
              and a short text justification.
            </li>
          </ul>
        </section>
      </div>

      <section className="panel my-4 p-5">
        <h2 className="section-title mb-3">Why UTD-24 Journals and Discipline Mapping?</h2>
        <p className="mb-3 text-sm leading-6 text-slate-700">
          <strong>UTD-24</strong> is the 24-journal basket used by the UT Dallas Top 100 Business School Research Rankings to
          track research output from business schools. Official ranking site:{" "}
          <a
            className="font-semibold text-teal-700 underline hover:text-teal-800"
            href="https://jsom.utdallas.edu/the-utd-top-100-business-school-research-rankings/"
            target="_blank"
            rel="noreferrer"
          >
            UTD Top 100 Business School Research Rankings
          </a>
          . Using this set keeps the analysis tied to journals that materially influence hiring, tenure, promotion, and
          doctoral training incentives.
        </p>
        <p className="mb-3 text-sm leading-6 text-slate-700">
          Following the method described in{" "}
          <a
            className="font-semibold text-teal-700 underline hover:text-teal-800"
            href="https://journals.sagepub.com/doi/10.1177/10591478241245978"
            target="_blank"
            rel="noreferrer"
          >
            (Mithas &amp; Silveira, 2024)
          </a>
          , the 24 journals are mapped into <strong>seven disciplines</strong>.
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {journalsByDiscipline.map((group) => (
            <article key={group.discipline} className="rounded-lg border border-slate-200 bg-white/85 p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">
                {group.discipline}{" "}
                <span className="text-xs font-normal text-slate-500">({group.journals.length} journals)</span>
              </h3>
              <div className="space-y-2">
                {group.journals.map((abbr) => (
                  <a
                    key={abbr}
                    href={journalLinks[abbr]}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md border border-slate-200 bg-slate-50 p-2 transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    <div className="text-xs font-bold tracking-wide text-teal-700">{abbr}</div>
                    <div className="text-xs text-slate-600">{journalFullName(abbr)}</div>
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="section-title mb-3">Scoring Method (LLM-Assisted)</h2>
          <p className="mb-3 text-sm leading-6 text-slate-700">
            Articles are scored with a structured prompt protocol using title/abstract metadata. The goal is not mystical
            certainty; the goal is <strong>repeatable, inspectable scoring</strong> at scale.
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>
              A <strong>system prompt</strong> defines &quot;wokeness&quot; as socially progressive themes (DEI, social justice, ethical
              critiques, and marginalization-related framing) with discipline-specific context.
            </li>
            <li>
              A <strong>task prompt</strong> asks for a 1-10 score using only provided metadata and abstract text.
            </li>
            <li>
              The model must return supporting keywords and a short explanation so each score remains auditable.
            </li>
            <li>
              Output is stored in a consistent JSON-like schema (`woke_score`, `keywords`, `justification`) for every paper.
            </li>
            <li>
              These article-level outputs are then aggregated into trends by year, discipline, journal, and author.
            </li>
            <li>
              The result: a large-scale map of language signals in elite business journals, with enough transparency to
              inspect edge cases instead of pretending edge cases do not exist.
            </li>
          </ol>
        </section>

        <section className="panel p-5">
          <h2 className="section-title mb-3">What You Can Explore</h2>
          <div className="grid gap-3">
          {featureCards.map((card) => (
            <article key={card.title} className="rounded-lg border border-slate-200 bg-white/85 p-4">
              <h3 className="mb-1 text-base font-semibold text-slate-900">{card.title}</h3>
              <p className="text-sm text-slate-700">{card.text}</p>
            </article>
          ))}
          </div>
        </section>
      </div>

      <section className="panel p-5">
        <h2 className="section-title mb-3">Interpretation Notes</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>Scores reflect model judgments of text signals, not direct measures of article quality or scholarly rigor.</li>
          <li>
            Inputs are limited to title and abstract context, so full-paper nuance, methods, and framing may be only partly
            captured.
          </li>
          <li>
            The term &quot;woke&quot; is operationalized for analysis and is itself contested; treat the site as an exploratory
            instrument, not scripture.
          </li>
          <li>
            Comparisons are most informative when paired with filters, keyword evidence, and disciplinary context.
          </li>
        </ul>
      </section>
    </main>
  );
}

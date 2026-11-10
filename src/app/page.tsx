import { Footer, Logo } from "@/components/Brand";
import { HeroSearch } from "@/components/HeroSearch";
import { DEMO_SHAPES } from "@/lib/demo";
import { imageSpanMeters, sumAreas } from "@/lib/geo";
import { buildQuote } from "@/lib/pricing";
import { SERVICE, SITE } from "@/lib/site";
import { M2_TO_SQFT, SURFACE_META, SURFACE_TYPES } from "@/lib/types";

const sqft = (m2: number) => Math.round(m2 * M2_TO_SQFT);
const money = (n: number) => `$${n.toLocaleString("en-CA")}`;

export default function Home() {
  // The example on this page is priced by the same engine customers get, so it can't drift.
  const exampleAreas = sumAreas(DEMO_SHAPES, imageSpanMeters(50.4452));
  const example = buildQuote(exampleAreas, { steps: false, iceMelt: false });
  const [seasonal, monthly, perVisit] = example.plans;
  const pts = (points: [number, number][]) => points.map(([x, y]) => `${x * 100},${y * 100}`).join(" ");

  const faqs = [
    {
      q: "How accurate is the measurement?",
      a: "We outline your driveway, sidewalk and walkway on Google's most recent satellite image of your address, then show you the outlines. If a tree or a parked car hid something, drag the corners to fix it or type the numbers yourself. If our crew finds a real difference on the first visit, we'll talk to you before anything changes.",
    },
    {
      q: "When do you come?",
      a: `On a season or monthly plan, every snowfall of ${SERVICE.triggerCm} cm or more gets cleared within ${SERVICE.clearWithinHours} hours of the snow stopping. You don't need to call or be home.`,
    },
    {
      q: "Do you clear the city sidewalk too?",
      a: "Yes. The City of Regina requires residents to clear the public sidewalk beside their property after a snowfall, so we measure it and include it in your price. Corner lots have more sidewalk, and the price reflects that.",
    },
    {
      q: "What if it's a heavy winter?",
      a: "Season and monthly prices are fixed. If it snows more than usual, you don't pay more.",
    },
    {
      q: "Do I pay online?",
      a: "Not yet. You send a request with your plan, we call or text to confirm the details and your start date, and you pay after that.",
    },
    {
      q: "Who does the work?",
      a: "Local Regina operators working under contract to ClearLot. You deal with us for scheduling, billing and anything that isn't right.",
    },
  ];

  return (
    <>
      <div className="bg-night text-white">
        <header className="wrap flex h-16 items-center justify-between">
          <Logo light />
          <nav aria-label="Main" className="flex items-center gap-5 text-sm font-semibold">
            <a href="#how" className="hidden hover:underline sm:inline">
              How it works
            </a>
            <a href="#pricing" className="hidden hover:underline sm:inline">
              Pricing
            </a>
            <a href="#faq" className="hidden hover:underline sm:inline">
              Questions
            </a>
            <a href="#top-quote" className="btn btn-primary btn-sm">
              Get my price
            </a>
          </nav>
        </header>

        <main id="main">
          <section className="wrap grid items-center gap-10 pb-16 pt-8 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:pb-24">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-sidewalk">{SITE.city}, Saskatchewan</p>
              <h1 className="mt-3 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
                Snow removal priced from your address, not a guess.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-white/80">
                Type your address. We measure your driveway, city sidewalk and walkway from a satellite image and show
                you an exact price for the winter. It takes about a minute, and nobody has to come out and look.
              </p>
              <div id="top-quote" className="mt-8 max-w-xl scroll-mt-24">
                <HeroSearch />
              </div>
              <p className="mt-4 text-sm text-white/65">Free to check. No account, no payment to see your price.</p>
            </div>

            {/* The product itself: a measured lot and the price it produces. */}
            <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="relative aspect-square overflow-hidden rounded-[16px] border border-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/demo-lot.svg"
                  alt="Overhead view of a house with its driveway, sidewalk and walkway outlined and measured"
                  width={640}
                  height={640}
                  className="h-full w-full"
                  fetchPriority="high"
                />
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
                  {DEMO_SHAPES.map((s) => (
                    <polygon
                      key={s.id}
                      points={pts(s.points)}
                      fill={SURFACE_META[s.type].color}
                      fillOpacity="0.4"
                      stroke={SURFACE_META[s.type].color}
                      strokeWidth="0.5"
                    />
                  ))}
                </svg>
              </div>
              <figcaption className="card absolute -bottom-6 left-3 right-3 p-4 text-ink shadow-card sm:left-auto sm:right-[-12px] sm:w-72">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Example property</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {SURFACE_TYPES.map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm" style={{ background: SURFACE_META[t].color }} />
                      <span className="flex-1">{SURFACE_META[t].label}</span>
                      <span className="font-semibold tabular-nums">{sqft(exampleAreas[t])} sq ft</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-line pt-3">
                  <span className="font-display text-2xl font-bold tabular-nums">{money(monthly.amount)}</span>{" "}
                  <span className="text-sm text-ink-soft">per month + GST</span>
                </p>
              </figcaption>
            </figure>
          </section>
        </main>
      </div>

      <section id="how" className="wrap scroll-mt-8 py-14 sm:py-24">
        <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">From address to booked in three steps</h2>
        <ol className="mt-10 grid gap-x-10 gap-y-10 md:grid-cols-3">
          {[
            {
              t: "Enter your address",
              d: "We pull up Google's latest satellite image of your home. Regina addresses only for now.",
            },
            {
              t: "Check the outlines",
              d: "Your driveway, sidewalk and walkway are outlined and measured automatically. Drag a corner if we got something wrong, or add an area we missed.",
            },
            {
              t: "Pick a plan",
              d: "See the price for the full season, month by month, or a single visit. Send your request and we confirm by phone or text.",
            },
          ].map((s, i) => (
            <li key={s.t} className="border-t-2 border-ink pt-5">
              <span className="font-display text-sm font-bold text-ink-faint">Step {i + 1}</span>
              <h3 className="mt-1 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-ink-soft">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-ice">
        <div className="wrap grid gap-10 py-14 sm:py-24 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">What a visit covers</h2>
            <p className="mt-4 max-w-md text-ink-soft">
              You pay for the surfaces you actually have. A single driveway on a 25-foot lot costs less than a triple
              driveway on a corner.
            </p>
          </div>
          <dl className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {[
              ["Driveway", "Cleared edge to edge, including the ridge the city plow leaves at the end."],
              ["City sidewalk", "The public sidewalk along your lot, which residents are responsible for."],
              ["Walkway", "The path to your front door, so deliveries and visitors can reach it."],
              ["Optional extras", "Front steps and landing shovelled by hand, and ice melt after clearing."],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="font-display text-lg font-bold">{t}</dt>
                <dd className="mt-1 text-ink-soft">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="pricing" className="wrap scroll-mt-8 py-14 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">Three ways to pay</h2>
          <p className="mt-4 text-ink-soft">
            Your price depends on your measurements. These are the prices for the example property above:{" "}
            {sqft(exampleAreas.driveway)} sq ft of driveway, {sqft(exampleAreas.sidewalk)} sq ft of sidewalk and a{" "}
            {sqft(exampleAreas.walkway)} sq ft walkway.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { p: seasonal, note: "Best value" },
            { p: monthly, note: "" },
            { p: perVisit, note: "" },
          ].map(({ p, note }) => (
            <div key={p.id} className={`card flex flex-col p-6 ${note ? "!border-ink ring-2 ring-ink" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold">{p.name}</h3>
                {note && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-ink">{note}</span>
                )}
              </div>
              <p className="mt-4">
                <span className="font-display text-4xl font-bold tabular-nums">{money(p.amount)}</span>
                <span className="ml-2 text-ink-soft">{p.unit}</span>
              </p>
              <p className="text-sm text-ink-faint">plus GST · example property</p>
              <p className="mt-4 text-ink-soft">{p.blurb}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-ink-soft">The season runs {SERVICE.seasonLabel}.</p>
      </section>

      <section id="faq" className="scroll-mt-8 border-t border-line bg-paper">
        <div className="wrap grid gap-10 py-14 sm:py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <h2 className="text-3xl font-bold sm:text-4xl">Questions people ask first</h2>
          <div className="divide-y divide-line border-y border-line">
            {faqs.map((f) => (
              <details key={f.q} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-display text-lg font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-2xl font-normal text-ink-faint transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-5 text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-night text-white">
        <div className="wrap grid items-center gap-8 py-14 sm:py-20 lg:grid-cols-2">
          <h2 className="text-3xl font-bold sm:text-4xl">See your price before the next snowfall.</h2>
          <HeroSearch cta="Get my price" />
        </div>
      </section>

      <Footer />
    </>
  );
}

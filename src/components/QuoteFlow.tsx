"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddressSearch, type PickedAddress } from "./AddressSearch";
import { SurfaceEditor } from "./SurfaceEditor";
import { sumAreas } from "@/lib/geo";
import {
  M2_TO_SQFT,
  SURFACE_META,
  SURFACE_TYPES,
  type AnalysisResult,
  type Areas,
  type PlanId,
  type PlanPrice,
  type Property,
  type Quote,
  type QuoteOptions,
  type Shape,
  type SurfaceType,
} from "@/lib/types";

const money = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: n % 1 ? 2 : 0 });
const toSqft = (m2: number) => Math.round(m2 * M2_TO_SQFT);

type Typed = Record<SurfaceType, string>;

export function QuoteFlow({ triggerCm, clearWithinHours }: { triggerCm: number; clearWithinHours: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const placeId = params.get("place");
  const session = params.get("session") ?? "";

  const [property, setProperty] = useState<Property | null>(null);
  const [loadError, setLoadError] = useState("");
  const [measuring, setMeasuring] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<Shape[][]>([]);
  const [edited, setEdited] = useState(false);
  const shapesRef = useRef(shapes);
  shapesRef.current = shapes;

  const [typed, setTyped] = useState<Typed | null>(null);
  const [options, setOptions] = useState<QuoteOptions>({ steps: false, iceMelt: false });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [planId, setPlanId] = useState<PlanId>("seasonal");

  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "", company: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<{ message: string; field?: string } | null>(null);
  const [done, setDone] = useState<{ ref: string; plan: PlanPrice } | null>(null);

  // 1. Look up the property, then measure it.
  useEffect(() => {
    if (!placeId) return;
    let cancelled = false;
    setProperty(null);
    setLoadError("");
    setAnalysis(null);
    setShapes([]);
    setHistory([]);
    setEdited(false);
    setTyped(null);
    setImageFailed(false);
    setDone(null);

    (async () => {
      try {
        const res = await fetch("/api/property", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placeId, session }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) return setLoadError(data.error ?? "We couldn't look up that address.");
        const prop = data as Property;
        setProperty(prop);
        setMeasuring(true);
        const ares = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: prop.lat, lng: prop.lng, demo: prop.demo }),
        });
        const result = (await ares.json()) as AnalysisResult;
        if (cancelled) return;
        if (ares.ok && Array.isArray(result.shapes)) {
          setAnalysis(result);
          // Keep anything the customer drew while they were waiting.
          setShapes((current) => (current.length ? current : result.shapes));
        } else {
          setAnalysis({ shapes: [], source: "none", quality: "unusable", note: "" });
        }
      } catch {
        if (!cancelled) setLoadError("We couldn't reach the server. Check your connection and try again.");
      } finally {
        if (!cancelled) setMeasuring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [placeId, session]);

  const beginEdit = useCallback(() => {
    setHistory((h) => [...h.slice(-49), shapesRef.current]);
    setEdited(true);
  }, []);
  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      setShapes(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }, []);

  const drawn = useMemo(
    () => (property ? sumAreas(shapes, property.imageSpanM) : { driveway: 0, sidewalk: 0, walkway: 0 }),
    [shapes, property],
  );
  const areas: Areas = useMemo(() => {
    if (!typed) return drawn;
    const m2 = (v: string) => Math.min(5000, Math.max(0, (Number(v) || 0) / M2_TO_SQFT));
    return { driveway: m2(typed.driveway), sidewalk: m2(typed.sidewalk), walkway: m2(typed.walkway) };
  }, [typed, drawn]);
  const totalM2 = areas.driveway + areas.sidewalk + areas.walkway;

  // 2. Price it. Pricing lives on the server, so margins never ship to the browser.
  useEffect(() => {
    if (totalM2 < 1) return setQuote(null);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ areas, options }),
          signal: controller.signal,
        });
        if (res.ok) setQuote(await res.json());
      } catch {
        /* superseded by a newer request */
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [areas, options, totalM2]);

  const plan = quote?.plans.find((p) => p.id === planId) ?? null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!property || !plan) return;
    setSubmitting(true);
    setFormError(null);
    const measuredBy = typed
      ? "typed"
      : property.demo
        ? "demo"
        : analysis?.source === "ai"
          ? edited
            ? "ai-edited"
            : "ai"
          : "drawn";
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          plan: planId,
          areas,
          options,
          address: property.address,
          lat: property.lat,
          lng: property.lng,
          measuredBy,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setFormError({ message: data.error ?? "Something went wrong.", field: data.field });
      setDone(data);
      window.scrollTo({ top: 0 });
    } catch {
      setFormError({ message: "We couldn't reach the server. Check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const pick = (a: PickedAddress) =>
    router.push(`/quote?place=${encodeURIComponent(a.placeId)}&session=${encodeURIComponent(a.session)}`);

  // ---------- Screens ----------

  if (!placeId || loadError) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Let&apos;s find your property</h1>
        <p className="mt-3 text-ink-soft">
          Type your address and pick it from the list. We&apos;ll pull up the satellite view and measure what needs
          clearing.
        </p>
        {loadError && (
          <p role="alert" className="mt-5 rounded-[10px] border border-bad/30 bg-bad/5 p-4 font-semibold text-bad">
            {loadError}
          </p>
        )}
        <div className="card mt-6 p-5">
          <AddressSearch onPick={pick} autoFocus />
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-good/10 px-3 py-1 text-sm font-semibold text-good">
          Request received
        </p>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Thanks, {form.name.split(" ")[0]}. You&apos;re on our list.</h1>
        <p className="mt-3 text-ink-soft">
          Nothing has been charged. We&apos;ll call or text you at {form.phone} to confirm the details and your start
          date.
        </p>
        <dl className="card mt-6 divide-y divide-line">
          {[
            ["Reference", done.ref],
            ["Address", property?.address ?? ""],
            ["Plan", done.plan.name],
            ["Price", `${money(done.plan.amount)} ${done.plan.unit} + GST`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-5 py-3.5">
              <dt className="text-ink-soft">{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <Link href="/" className="btn btn-quiet mt-6">
          Back to home
        </Link>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" aria-busy="true">
        <div>
          <div className="h-8 w-2/3 animate-pulse rounded bg-line" />
          <div className="mt-6 aspect-square w-full animate-pulse rounded-[16px] bg-line" />
        </div>
        <p className="text-ink-soft lg:pt-16" role="status">
          Finding your property…
        </p>
      </div>
    );
  }

  const fieldClass = (name: string) => `field ${formError?.field === name ? "!border-bad" : ""}`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-soft">Step 1 of 2 · Check the outlines</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{property.address}</h1>
        </div>
        <Link href="/quote" className="text-sm font-semibold underline">
          Change address
        </Link>
      </div>

      {property.demo && (
        <p className="mt-4 rounded-[10px] bg-ice p-3.5 text-sm">
          <strong>Demo mode.</strong> This is a sample property with sample outlines. Add your Google Maps and Claude
          keys to measure real addresses.
        </p>
      )}

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section aria-label="Satellite view and outlines">
          {imageFailed ? (
            <div className="card p-5">
              <p className="font-semibold">We couldn&apos;t load the satellite image for this address.</p>
              <p className="mt-1 text-sm text-ink-soft">
                You can still get a price by typing your measurements on the right.
              </p>
            </div>
          ) : (
            <SurfaceEditor
              imageUrl={property.imageUrl}
              imageSpanM={property.imageSpanM}
              shapes={shapes}
              onBeginEdit={beginEdit}
              onChange={setShapes}
              onUndo={undo}
              canUndo={history.length > 0}
              measuring={measuring}
              onImageError={() => {
                setImageFailed(true);
                setTyped((t) => t ?? { driveway: "", sidewalk: "", walkway: "" });
              }}
            />
          )}
          {!measuring && analysis?.source === "ai" && analysis.note && (
            <p className="mt-2 rounded-[10px] bg-ice p-3.5 text-sm">
              <strong>Worth a look:</strong> {analysis.note}
            </p>
          )}
          {!measuring && analysis?.source === "none" && !shapes.length && !imageFailed && (
            <p className="mt-2 rounded-[10px] bg-ice p-3.5 text-sm">
              <strong>We couldn&apos;t measure this one automatically.</strong> Outline your driveway with the buttons
              above the image, or type your measurements instead.
            </p>
          )}
        </section>

        <div className="space-y-6 lg:sticky lg:top-6">
          <section className="card p-5" aria-labelledby="areas-h">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <h2 id="areas-h" className="text-lg font-bold">
                What we&apos;ll clear
              </h2>
              <button
                type="button"
                className="text-sm font-semibold underline"
                onClick={() =>
                  setTyped((t) =>
                    t
                      ? null
                      : {
                          driveway: String(toSqft(drawn.driveway) || ""),
                          sidewalk: String(toSqft(drawn.sidewalk) || ""),
                          walkway: String(toSqft(drawn.walkway) || ""),
                        },
                  )
                }
              >
                {typed ? "Use the outlines instead" : "Type measurements instead"}
              </button>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {SURFACE_TYPES.map((t) => (
                <li key={t} className="flex items-center gap-3 py-3">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-sm"
                    style={{ background: SURFACE_META[t].color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <label htmlFor={`area-${t}`} className="block font-semibold">
                      {SURFACE_META[t].label}
                    </label>
                    <span className="block text-sm text-ink-soft">{SURFACE_META[t].hint}</span>
                  </span>
                  {typed ? (
                    <span className="flex items-center gap-2">
                      <input
                        id={`area-${t}`}
                        className="field !w-24 text-right tabular-nums"
                        inputMode="numeric"
                        value={typed[t]}
                        placeholder="0"
                        onChange={(e) => setTyped({ ...typed, [t]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })}
                      />
                      <span className="text-sm text-ink-soft">sq ft</span>
                    </span>
                  ) : (
                    <output id={`area-${t}`} className="text-right tabular-nums">
                      <span className="block font-semibold">
                        {measuring ? "…" : `${toSqft(areas[t]).toLocaleString("en-CA")} sq ft`}
                      </span>
                      {!measuring && <span className="block text-sm text-ink-soft">{areas[t].toFixed(0)} m²</span>}
                    </output>
                  )}
                </li>
              ))}
            </ul>
            <fieldset className="mt-2 border-t border-line pt-4">
              <legend className="sr-only">Extras</legend>
              {(
                [
                  ["steps", "Front steps and landing", "Shovelled by hand on every visit"],
                  ["iceMelt", "Ice melt", "Spread on the driveway and walks after clearing"],
                ] as const
              ).map(([key, label, hint]) => (
                <label key={key} className="flex min-h-12 cursor-pointer items-center gap-3 py-1.5">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[var(--color-ink)]"
                    checked={options[key]}
                    onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                  />
                  <span>
                    <span className="block font-semibold">{label}</span>
                    <span className="block text-sm text-ink-soft">{hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </section>

          <section aria-labelledby="plans-h">
            <p className="text-sm font-semibold text-ink-soft">Step 2 of 2 · Pick a plan</p>
            <h2 id="plans-h" className="mt-1 text-lg font-bold">
              Your price
            </h2>
            {!quote ? (
              <p className="card mt-3 p-5 text-ink-soft">
                {measuring
                  ? "Your price appears as soon as we finish measuring."
                  : totalM2 >= 1
                    ? "Working out your price…"
                    : "Outline or type at least one area to see your price."}
              </p>
            ) : quote.needsManualQuote ? (
              <p className="card mt-3 p-5">
                <strong>This is a bigger property than we price online.</strong>{" "}
                <span className="text-ink-soft">Send your details below and we&apos;ll quote it by hand.</span>
              </p>
            ) : (
              <div role="radiogroup" aria-labelledby="plans-h" className="mt-3 space-y-3">
                {quote.plans.map((p) => {
                  const on = p.id === planId;
                  return (
                    <label
                      key={p.id}
                      className={`card relative flex cursor-pointer gap-3 p-4 transition-colors ${on ? "!border-ink ring-2 ring-ink" : "hover:border-ink-faint"}`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        className="mt-1 h-5 w-5 accent-[var(--color-ink)]"
                        checked={on}
                        onChange={() => setPlanId(p.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-lg font-bold">{p.name}</span>
                          {p.id === "seasonal" && (
                            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-ink">
                              Best value
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-soft">{p.blurb}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-display text-2xl font-bold tabular-nums">{money(p.amount)}</span>
                        <span className="block text-sm text-ink-soft">{p.unit} + GST</span>
                      </span>
                    </label>
                  );
                })}
                <p className="text-sm text-ink-soft">
                  Season plans cover every snowfall of {triggerCm} cm or more, cleared within {clearWithinHours} hours
                  of the snow stopping. The price doesn&apos;t change if it&apos;s a heavy winter.
                </p>
              </div>
            )}
          </section>

          {quote && (
            <form onSubmit={submit} className="card space-y-4 p-5" noValidate aria-labelledby="book-h">
              <h2 id="book-h" className="text-lg font-bold">
                Request your spot
              </h2>
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">
                  Name
                </label>
                <input
                  id="name"
                  className={fieldClass("name")}
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold">
                    Mobile number
                  </label>
                  <input
                    id="phone"
                    className={fieldClass("phone")}
                    type="tel"
                    autoComplete="tel"
                    placeholder="306 555 0123"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
                    Email
                  </label>
                  <input
                    id="email"
                    className={fieldClass("email")}
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold">
                  Anything we should know? <span className="font-normal text-ink-soft">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  className="field !h-auto py-3"
                  rows={2}
                  maxLength={600}
                  placeholder="Gate code, where to pile snow, a car that's always parked…"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              {/* Honeypot: hidden from people, tempting to bots. */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              {formError && (
                <p role="alert" className="rounded-[10px] border border-bad/30 bg-bad/5 p-3 text-sm font-semibold text-bad">
                  {formError.message}
                </p>
              )}
              <button type="submit" className="btn btn-primary w-full" disabled={submitting || !plan}>
                {submitting
                  ? "Sending…"
                  : plan && !quote.needsManualQuote
                    ? `Request ${plan.name.toLowerCase()} · ${money(plan.amount)}`
                    : "Request a quote"}
              </button>
              <p className="text-sm text-ink-soft">
                No payment now. We confirm by phone or text first. We only use your details to arrange your snow
                removal.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import "server-only";
import { SERVICE } from "./site";
import type { Areas, PlanId, PlanPrice, Quote, QuoteOptions } from "./types";

/**
 * ClearLot pricing model. Everything here is server-side only, so margins never reach the browser.
 *
 * How a price is built:
 *   1. Work out what the subcontractor is paid for one visit to this property.
 *   2. Gross that up so ads, card fees, admin and your profit are all covered:
 *        price = subcontractor pay / (1 - ads - processing - admin - profit)
 *   3. Turn the per-visit price into plan prices using the expected number of visits.
 *
 * Tune the numbers below once you have real subcontractor quotes. `npm test` checks that
 * every plan still clears the target profit after you change them.
 */
export const PRICING = {
  /** What you pay the subcontractor, per visit. */
  subcontractor: {
    /** Travel, setup, unloading the blower. Paid on every visit regardless of size. */
    baseVisit: 15,
    /** $ per square metre. Driveways are mostly machine work; sidewalks and walkways are slower. */
    perM2: { driveway: 0.2, sidewalk: 0.25, walkway: 0.3 },
    /** Front steps and landing, shovelled by hand. */
    steps: 4,
    /** Ice melt: product plus spreading time. */
    iceMeltBase: 4,
    iceMeltPerM2: 0.05,
  },

  /** Share of every dollar of revenue set aside for each cost. */
  overhead: {
    ads: 0.12,
    paymentProcessing: 0.03,
    insuranceAndAdmin: 0.05,
  },

  /** Your profit as a share of revenue, after the subcontractor and overhead are paid. */
  targetProfit: 0.22,

  /** Never quote a visit below this, however small the property. */
  minVisitPrice: 45,

  /** Visits you expect to dispatch in a season (Nov 1 to Mar 31) at the snowfall trigger below. */
  expectedVisitsPerSeason: 16,
  seasonMonths: 5,

  plans: {
    /** Paid up front for the whole season: best cash flow for you, best price for them. */
    seasonal: { discount: 0.1 },
    monthly: { discount: 0.05 },
    /** One-off call-outs are harder to route, so they cost more. */
    perVisit: { premium: 0.15 },
  },

  gst: 0.05,

  /** Above this total area the property is quoted by hand (large lots, commercial). */
  maxOnlineAreaM2: 900,
} as const;

export const SERVICE_TERMS = SERVICE;

export interface VisitEconomics {
  subcontractorPay: number;
  price: number;
  ads: number;
  paymentProcessing: number;
  insuranceAndAdmin: number;
  profit: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function subcontractorPayPerVisit(areas: Areas, options: QuoteOptions): number {
  const s = PRICING.subcontractor;
  const total = areas.driveway + areas.sidewalk + areas.walkway;
  let pay =
    s.baseVisit +
    areas.driveway * s.perM2.driveway +
    areas.sidewalk * s.perM2.sidewalk +
    areas.walkway * s.perM2.walkway;
  if (options.steps) pay += s.steps;
  if (options.iceMelt) pay += s.iceMeltBase + total * s.iceMeltPerM2;
  return round2(pay);
}

/** Standard price for one visit, before plan discounts and GST. */
export function visitPrice(areas: Areas, options: QuoteOptions): number {
  const o = PRICING.overhead;
  const keep = 1 - o.ads - o.paymentProcessing - o.insuranceAndAdmin - PRICING.targetProfit;
  const grossedUp = subcontractorPayPerVisit(areas, options) / keep;
  return Math.max(PRICING.minVisitPrice, Math.ceil(grossedUp));
}

/** Where each dollar of a visit goes, given what the customer actually pays per visit. */
export function visitEconomics(areas: Areas, options: QuoteOptions, pricePerVisit: number): VisitEconomics {
  const o = PRICING.overhead;
  const subcontractorPay = subcontractorPayPerVisit(areas, options);
  const ads = round2(pricePerVisit * o.ads);
  const paymentProcessing = round2(pricePerVisit * o.paymentProcessing);
  const insuranceAndAdmin = round2(pricePerVisit * o.insuranceAndAdmin);
  return {
    subcontractorPay,
    price: pricePerVisit,
    ads,
    paymentProcessing,
    insuranceAndAdmin,
    profit: round2(pricePerVisit - subcontractorPay - ads - paymentProcessing - insuranceAndAdmin),
  };
}

function plan(id: PlanId, name: string, amount: number, unit: string, blurb: string, perVisit: number): PlanPrice {
  const gst = round2(amount * PRICING.gst);
  return { id, name, amount, unit, gst, total: round2(amount + gst), blurb, perVisitEquivalent: round2(perVisit) };
}

export function buildQuote(areas: Areas, options: QuoteOptions): Quote {
  const totalAreaM2 = areas.driveway + areas.sidewalk + areas.walkway;
  const base = visitPrice(areas, options);
  const visits = PRICING.expectedVisitsPerSeason;
  const p = PRICING.plans;

  const seasonal = Math.ceil((base * visits * (1 - p.seasonal.discount)) / 5) * 5;
  const monthly = Math.ceil((base * visits * (1 - p.monthly.discount)) / PRICING.seasonMonths);
  const perVisit = Math.ceil(base * (1 + p.perVisit.premium));

  return {
    totalAreaM2,
    needsManualQuote: totalAreaM2 > PRICING.maxOnlineAreaM2,
    plans: [
      plan(
        "seasonal",
        "Full season",
        seasonal,
        "for the season",
        `Pay once. Every snowfall of ${SERVICE_TERMS.triggerCm} cm or more is cleared, ${SERVICE_TERMS.seasonLabel}.`,
        seasonal / visits,
      ),
      plan(
        "monthly",
        "Monthly",
        monthly,
        "per month",
        `Same coverage as the full season, billed in ${PRICING.seasonMonths} monthly payments.`,
        (monthly * PRICING.seasonMonths) / visits,
      ),
      plan("perVisit", "Single visit", perVisit, "per visit", "Book a clearing when you need one. No commitment.", perVisit),
    ],
  };
}

import { describe, expect, it } from "vitest";
import { imageSpanMeters, inServiceArea, metersPerPixel, normalizedArea, shapeAreaM2 } from "@/lib/geo";
import { DEMO_SHAPES } from "@/lib/demo";
import { PRICING, buildQuote, subcontractorPayPerVisit, visitEconomics, visitPrice } from "@/lib/pricing";
import type { Areas } from "@/lib/types";

const none = { steps: false, iceMelt: false };
const typical: Areas = { driveway: 66, sidewalk: 23, walkway: 13 };

describe("geometry", () => {
  it("matches the known Web Mercator resolution at Regina's latitude", () => {
    expect(metersPerPixel(50.445, 20)).toBeCloseTo(0.0951, 3);
    expect(imageSpanMeters(50.445)).toBeCloseTo(60.8, 0);
  });

  it("computes polygon area regardless of winding", () => {
    expect(normalizedArea([[0, 0], [0.5, 0], [0.5, 0.5], [0, 0.5]])).toBeCloseTo(0.25);
    expect(normalizedArea([[0, 0.5], [0.5, 0.5], [0.5, 0], [0, 0]])).toBeCloseTo(0.25);
    expect(normalizedArea([[0, 0], [1, 1]])).toBe(0);
  });

  it("measures the demo driveway at a realistic size", () => {
    const span = imageSpanMeters(50.4452);
    const driveway = shapeAreaM2(DEMO_SHAPES[0].points, span);
    expect(driveway).toBeGreaterThan(60);
    expect(driveway).toBeLessThan(72);
  });

  it("accepts Regina and rejects nearby towns", () => {
    expect(inServiceArea(50.4452, -104.6189)).toBe(true); // downtown
    expect(inServiceArea(50.4405, -104.37)).toBe(false); // White City
    expect(inServiceArea(52.13, -106.67)).toBe(false); // Saskatoon
  });
});

describe("pricing", () => {
  it("covers the subcontractor, overhead and target profit on a standard visit", () => {
    const price = visitPrice(typical, none);
    const e = visitEconomics(typical, none, price);
    expect(e.subcontractorPay).toBe(subcontractorPayPerVisit(typical, none));
    expect(e.profit / price).toBeGreaterThanOrEqual(PRICING.targetProfit - 0.005);
  });

  it("never goes below the minimum visit price", () => {
    expect(visitPrice({ driveway: 5, sidewalk: 0, walkway: 0 }, none)).toBe(PRICING.minVisitPrice);
  });

  it("charges more for bigger properties and add-ons", () => {
    const big: Areas = { driveway: 140, sidewalk: 60, walkway: 20 };
    expect(visitPrice(big, none)).toBeGreaterThan(visitPrice(typical, none));
    expect(visitPrice(typical, { steps: true, iceMelt: true })).toBeGreaterThan(visitPrice(typical, none));
  });

  it("keeps every plan profitable at the expected number of visits", () => {
    for (const areas of [typical, { driveway: 30, sidewalk: 10, walkway: 0 }, { driveway: 200, sidewalk: 70, walkway: 30 }]) {
      const quote = buildQuote(areas, none);
      for (const plan of quote.plans) {
        const e = visitEconomics(areas, none, plan.perVisitEquivalent);
        expect(e.profit, `${plan.id} profit`).toBeGreaterThan(0);
        expect(e.profit / e.price, `${plan.id} margin`).toBeGreaterThanOrEqual(0.05);
      }
    }
  });

  it("orders plans so committing saves money per visit", () => {
    const [seasonal, monthly, perVisit] = buildQuote(typical, none).plans;
    expect(seasonal.perVisitEquivalent).toBeLessThan(monthly.perVisitEquivalent);
    expect(monthly.perVisitEquivalent).toBeLessThan(perVisit.perVisitEquivalent);
    expect(seasonal.total).toBeCloseTo(seasonal.amount * 1.05, 2);
  });

  it("flags oversized properties for a manual quote", () => {
    expect(buildQuote({ driveway: 800, sidewalk: 200, walkway: 0 }, none).needsManualQuote).toBe(true);
    expect(buildQuote(typical, none).needsManualQuote).toBe(false);
  });
});

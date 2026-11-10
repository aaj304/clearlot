export const SURFACE_TYPES = ["driveway", "sidewalk", "walkway"] as const;
export type SurfaceType = (typeof SURFACE_TYPES)[number];

/** A point in image space, both axes normalised to 0..1 (origin top-left). */
export type Point = [number, number];

export interface Shape {
  id: string;
  type: SurfaceType;
  points: Point[];
}

/** Areas in square metres. */
export type Areas = Record<SurfaceType, number>;

export interface QuoteOptions {
  steps: boolean;
  iceMelt: boolean;
}

export const PLAN_IDS = ["seasonal", "monthly", "perVisit"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export interface PlanPrice {
  id: PlanId;
  name: string;
  /** Headline amount before GST, in dollars. */
  amount: number;
  unit: string;
  gst: number;
  total: number;
  blurb: string;
  /** What one visit works out to, before GST. */
  perVisitEquivalent: number;
}

export interface Quote {
  plans: PlanPrice[];
  totalAreaM2: number;
  /** True when the property is outside what we price online. */
  needsManualQuote: boolean;
}

export interface Property {
  address: string;
  lat: number;
  lng: number;
  /** Ground width covered by the square image, in metres. */
  imageSpanM: number;
  imageUrl: string;
  demo: boolean;
}

export interface AnalysisResult {
  shapes: Shape[];
  source: "ai" | "demo" | "none";
  quality: "clear" | "partly_obscured" | "unusable";
  note: string;
}

export const SURFACE_META: Record<SurfaceType, { label: string; color: string; hint: string }> = {
  driveway: { label: "Driveway", color: "#FF6A1A", hint: "Where you park, up to the street" },
  sidewalk: { label: "City sidewalk", color: "#19B8D6", hint: "The public sidewalk along your lot" },
  walkway: { label: "Walkway", color: "#E8C400", hint: "Path to your front door" },
};

export const M2_TO_SQFT = 10.7639;

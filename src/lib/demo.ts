import type { Point, Property, Shape } from "./types";
import { imageSpanMeters } from "./geo";

/**
 * Demo mode: used when GOOGLE_MAPS_API_KEY is not set, so the whole quote flow can be tried
 * (and shown to subcontractors or partners) before any paid API is connected.
 */
export const DEMO_ADDRESSES = [
  { placeId: "demo-1", main: "1234 Sample Street", secondary: "Regina, SK (demo property)" },
  { placeId: "demo-2", main: "56 Example Crescent", secondary: "Regina, SK (demo property)" },
  { placeId: "demo-3", main: "789 Placeholder Avenue", secondary: "Regina, SK (demo property)" },
];

const DEMO_LAT = 50.4452;
const DEMO_LNG = -104.6189;

export function demoProperty(placeId: string): Property | null {
  const match = DEMO_ADDRESSES.find((a) => a.placeId === placeId);
  if (!match) return null;
  return {
    address: `${match.main}, Regina, SK`,
    lat: DEMO_LAT,
    lng: DEMO_LNG,
    imageSpanM: imageSpanMeters(DEMO_LAT),
    imageUrl: "/demo-lot.svg",
    demo: true,
  };
}

const px = (pts: [number, number][]): Point[] => pts.map(([x, y]) => [x / 640, y / 640]);

/** Outlines that match public/demo-lot.svg. */
export const DEMO_SHAPES: Shape[] = [
  { id: "demo-driveway", type: "driveway", points: px([[262, 400], [322, 400], [322, 522], [262, 522]]) },
  { id: "demo-sidewalk", type: "sidewalk", points: px([[240, 522], [400, 522], [400, 538], [240, 538]]) },
  { id: "demo-walkway", type: "walkway", points: px([[342, 404], [354, 404], [354, 522], [342, 522]]) },
];

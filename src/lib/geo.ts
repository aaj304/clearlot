import type { Areas, Point, Shape } from "./types";

/** Satellite tile settings. 640px at zoom 20 covers roughly 61 m in Regina. */
export const IMAGE_PX = 640;
export const IMAGE_ZOOM = 20;

/** Regina city limits plus a small buffer (White City, Emerald Park and Pilot Butte are excluded). */
export const SERVICE_AREA = {
  name: "Regina",
  south: 50.385,
  north: 50.525,
  west: -104.78,
  east: -104.49,
};

export function inServiceArea(lat: number, lng: number): boolean {
  return (
    lat >= SERVICE_AREA.south &&
    lat <= SERVICE_AREA.north &&
    lng >= SERVICE_AREA.west &&
    lng <= SERVICE_AREA.east
  );
}

/** Web Mercator ground resolution in metres per pixel. */
export function metersPerPixel(lat: number, zoom = IMAGE_ZOOM): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

export function imageSpanMeters(lat: number): number {
  return metersPerPixel(lat) * IMAGE_PX;
}

/** Shoelace area of a polygon in normalised units (0..1 on each axis). */
export function normalizedArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

export function shapeAreaM2(points: Point[], imageSpanM: number): number {
  return normalizedArea(points) * imageSpanM * imageSpanM;
}

export function sumAreas(shapes: Shape[], imageSpanM: number): Areas {
  const areas: Areas = { driveway: 0, sidewalk: 0, walkway: 0 };
  for (const s of shapes) areas[s.type] += shapeAreaM2(s.points, imageSpanM);
  return areas;
}

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

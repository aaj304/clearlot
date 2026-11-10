import "server-only";
import { IMAGE_PX, IMAGE_ZOOM, SERVICE_AREA } from "./geo";

const key = () => process.env.GOOGLE_MAPS_API_KEY ?? "";
export const hasGoogle = () => key().length > 0;

export interface Suggestion {
  placeId: string;
  main: string;
  secondary: string;
}

/** Address autocomplete restricted to Regina. Uses Places API (New). */
export async function suggestAddresses(input: string, sessionToken: string): Promise<Suggestion[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key() },
    body: JSON.stringify({
      input,
      sessionToken,
      includedRegionCodes: ["ca"],
      includedPrimaryTypes: ["street_address", "premise", "subpremise"],
      locationRestriction: {
        rectangle: {
          low: { latitude: SERVICE_AREA.south, longitude: SERVICE_AREA.west },
          high: { latitude: SERVICE_AREA.north, longitude: SERVICE_AREA.east },
        },
      },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Places autocomplete failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    suggestions?: {
      placePrediction?: {
        placeId: string;
        text?: { text: string };
        structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
      };
    }[];
  };
  return (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 5)
    .map((p) => ({
      placeId: p.placeId,
      main: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondary: p.structuredFormat?.secondaryText?.text ?? "",
    }));
}

export async function placeLocation(
  placeId: string,
  sessionToken: string,
): Promise<{ address: string; lat: number; lng: number } | null> {
  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);
  const res = await fetch(url, {
    headers: { "X-Goog-Api-Key": key(), "X-Goog-FieldMask": "id,formattedAddress,location" },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(`Place details failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
  };
  if (!data.location) return null;
  return { address: data.formattedAddress ?? "", lat: data.location.latitude, lng: data.location.longitude };
}

const imageCache = new Map<string, Buffer>();
export const coordKey = (lat: number, lng: number) => `${lat.toFixed(6)},${lng.toFixed(6)}`;

/**
 * Google's most recent satellite image centred on the property, as PNG bytes
 * (1280x1280 pixels covering IMAGE_PX logical pixels at IMAGE_ZOOM).
 * Cached so the customer's view and the AI measurement share one billed request.
 */
export async function satelliteImage(lat: number, lng: number): Promise<Buffer> {
  const k = coordKey(lat, lng);
  const cached = imageCache.get(k);
  if (cached) return cached;

  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  url.searchParams.set("center", `${lat},${lng}`);
  url.searchParams.set("zoom", String(IMAGE_ZOOM));
  url.searchParams.set("size", `${IMAGE_PX}x${IMAGE_PX}`);
  url.searchParams.set("scale", "2");
  url.searchParams.set("maptype", "satellite");
  url.searchParams.set("format", "png");
  url.searchParams.set("key", key());

  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Static map failed: ${res.status} ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());

  if (imageCache.size >= 200) imageCache.delete(imageCache.keys().next().value as string);
  imageCache.set(k, buf);
  return buf;
}

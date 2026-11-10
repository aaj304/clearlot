import { z } from "zod";
import { hasClaude, measureSurfaces } from "@/lib/analyze";
import { DEMO_SHAPES } from "@/lib/demo";
import { imageSpanMeters, inServiceArea } from "@/lib/geo";
import { coordKey, hasGoogle, satelliteImage } from "@/lib/google";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";
import type { AnalysisResult } from "@/lib/types";

export const maxDuration = 120;

const Body = z.object({ lat: z.number(), lng: z.number(), demo: z.boolean().default(false) });

const results = new Map<string, AnalysisResult>();
const MANUAL: AnalysisResult = { shapes: [], source: "none", quality: "unusable", note: "" };

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid request." }, { status: 400 });
  const { lat, lng, demo } = body.data;

  if (demo || !hasGoogle()) {
    const result: AnalysisResult = { shapes: DEMO_SHAPES, source: "demo", quality: "clear", note: "" };
    return Response.json(result);
  }
  if (!inServiceArea(lat, lng)) return Response.json({ error: "Outside our service area." }, { status: 422 });
  if (!hasClaude()) return Response.json(MANUAL);

  const key = coordKey(lat, lng);
  const cached = results.get(key);
  if (cached) return Response.json(cached);

  if (!rateLimit(`analyze:${clientIp(req)}`, 8, 60 * 60_000)) return tooMany();

  try {
    const image = await satelliteImage(lat, lng);
    const result = await measureSurfaces(image, imageSpanMeters(lat));
    if (results.size >= 500) results.delete(results.keys().next().value as string);
    results.set(key, result);
    return Response.json(result);
  } catch (err) {
    // The customer can still outline surfaces by hand, so a failed measurement is not fatal.
    console.error("[analyze]", err);
    return Response.json(MANUAL);
  }
}

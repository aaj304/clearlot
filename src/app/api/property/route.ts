import { z } from "zod";
import { demoProperty } from "@/lib/demo";
import { imageSpanMeters, inServiceArea } from "@/lib/geo";
import { hasGoogle, placeLocation } from "@/lib/google";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";
import type { Property } from "@/lib/types";

const Body = z.object({ placeId: z.string().min(1).max(300), session: z.string().max(64).default("") });

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Pick an address from the list." }, { status: 400 });

  if (!hasGoogle() || body.data.placeId.startsWith("demo-")) {
    const demo = demoProperty(body.data.placeId);
    return demo
      ? Response.json(demo)
      : Response.json({ error: "Pick an address from the list." }, { status: 400 });
  }

  if (!rateLimit(`property:${clientIp(req)}`, 20, 60 * 60_000)) return tooMany();

  try {
    const place = await placeLocation(body.data.placeId, body.data.session);
    if (!place) return Response.json({ error: "We couldn't find that address. Try typing it again." }, { status: 404 });
    if (!inServiceArea(place.lat, place.lng)) {
      return Response.json(
        { error: "That address is outside Regina. We only serve addresses within city limits for now." },
        { status: 422 },
      );
    }
    const property: Property = {
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      imageSpanM: imageSpanMeters(place.lat),
      imageUrl: `/api/satellite?lat=${place.lat.toFixed(6)}&lng=${place.lng.toFixed(6)}`,
      demo: false,
    };
    return Response.json(property);
  } catch (err) {
    console.error("[property]", err);
    return Response.json({ error: "We couldn't look up that address. Please try again." }, { status: 502 });
  }
}

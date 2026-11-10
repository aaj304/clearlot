import { inServiceArea } from "@/lib/geo";
import { hasGoogle, satelliteImage } from "@/lib/google";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";

/** Proxies Google's satellite image so the Maps key stays on the server. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!hasGoogle() || !Number.isFinite(lat) || !Number.isFinite(lng) || !inServiceArea(lat, lng)) {
    return new Response("Not found", { status: 404 });
  }
  if (!rateLimit(`satellite:${clientIp(req)}`, 30, 60 * 60_000)) return tooMany();

  try {
    const image = await satelliteImage(lat, lng);
    return new Response(new Uint8Array(image), {
      headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=3600" },
    });
  } catch (err) {
    console.error("[satellite]", err);
    return new Response("Imagery unavailable", { status: 502 });
  }
}

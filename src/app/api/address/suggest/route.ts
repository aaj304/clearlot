import { DEMO_ADDRESSES } from "@/lib/demo";
import { hasGoogle, suggestAddresses } from "@/lib/google";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 120);
  const session = (searchParams.get("session") ?? "").slice(0, 64);

  if (!hasGoogle()) return Response.json({ demo: true, suggestions: DEMO_ADDRESSES });
  if (q.length < 3) return Response.json({ demo: false, suggestions: [] });
  if (!rateLimit(`suggest:${clientIp(req)}`, 120, 10 * 60_000)) return tooMany();

  try {
    return Response.json({ demo: false, suggestions: await suggestAddresses(q, session) });
  } catch (err) {
    console.error("[suggest]", err);
    return Response.json({ error: "Address search is unavailable right now." }, { status: 502 });
  }
}

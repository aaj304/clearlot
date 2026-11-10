import { buildQuote } from "@/lib/pricing";
import { QuoteRequest } from "@/lib/validation";

export async function POST(req: Request) {
  const body = QuoteRequest.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid measurements." }, { status: 400 });
  return Response.json(buildQuote(body.data.areas, body.data.options));
}

import { randomBytes } from "node:crypto";
import { inServiceArea } from "@/lib/geo";
import { deliverLead } from "@/lib/leads";
import { buildQuote, visitEconomics } from "@/lib/pricing";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";
import { BookRequest } from "@/lib/validation";

export async function POST(req: Request) {
  const body = BookRequest.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    const first = body.error.issues[0];
    const field = String(first?.path[0] ?? "");
    const message =
      field === "email"
        ? "Enter a valid email address."
        : field === "phone"
          ? "Enter a 10-digit phone number."
          : field === "name"
            ? "Enter your name."
            : "Something in the form isn't right. Please check it and try again.";
    return Response.json({ error: message, field }, { status: 400 });
  }
  const data = body.data;
  if (!rateLimit(`book:${clientIp(req)}`, 5, 60 * 60_000)) return tooMany();
  if (!inServiceArea(data.lat, data.lng)) {
    return Response.json({ error: "That address is outside our Regina service area." }, { status: 422 });
  }

  // Prices are always recomputed here; nothing the browser sends about price is trusted.
  const quote = buildQuote(data.areas, data.options);
  if (quote.totalAreaM2 < 1) {
    return Response.json({ error: "Add at least one area to clear before booking." }, { status: 400 });
  }
  const plan = quote.plans.find((p) => p.id === data.plan)!;
  const ref = `CL-${randomBytes(3).toString("hex").toUpperCase()}`;

  try {
    await deliverLead({
      ref,
      createdAt: new Date().toISOString(),
      name: data.name,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      areas: data.areas,
      options: data.options,
      plan,
      economics: visitEconomics(data.areas, data.options, plan.perVisitEquivalent),
      measuredBy: quote.needsManualQuote ? `${data.measuredBy} (over online limit: quote by hand)` : data.measuredBy,
    });
  } catch (err) {
    console.error("[book]", err);
    return Response.json(
      { error: "We couldn't save your request. Please try again in a minute." },
      { status: 500 },
    );
  }
  return Response.json({ ref, plan });
}

import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { M2_TO_SQFT, type Areas, type PlanPrice, type QuoteOptions } from "./types";
import { PRICING, SERVICE_TERMS, type VisitEconomics } from "./pricing";

export interface Lead {
  ref: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  address: string;
  lat: number;
  lng: number;
  areas: Areas;
  options: QuoteOptions;
  plan: PlanPrice;
  economics: VisitEconomics;
  measuredBy: string;
}

const money = (n: number) => `$${n.toFixed(2)}`;
const sqft = (m2: number) => `${Math.round(m2 * M2_TO_SQFT)} sq ft (${m2.toFixed(1)} m²)`;

function ownerEmail(lead: Lead): string {
  const e = lead.economics;
  const maps = `https://www.google.com/maps/search/?api=1&query=${lead.lat},${lead.lng}`;
  return [
    `New booking request ${lead.ref}`,
    ``,
    `CUSTOMER`,
    `  ${lead.name}`,
    `  ${lead.phone}`,
    `  ${lead.email}`,
    `  ${lead.address}`,
    `  ${maps}`,
    lead.notes ? `  Notes: ${lead.notes}` : ``,
    ``,
    `JOB`,
    `  Driveway:  ${sqft(lead.areas.driveway)}`,
    `  Sidewalk:  ${sqft(lead.areas.sidewalk)}`,
    `  Walkway:   ${sqft(lead.areas.walkway)}`,
    `  Front steps: ${lead.options.steps ? "yes" : "no"}   Ice melt: ${lead.options.iceMelt ? "yes" : "no"}`,
    `  Measured by: ${lead.measuredBy}`,
    ``,
    `PLAN: ${lead.plan.name}`,
    `  ${money(lead.plan.amount)} ${lead.plan.unit} + ${money(lead.plan.gst)} GST = ${money(lead.plan.total)}`,
    ``,
    `YOUR NUMBERS PER VISIT (not shown to the customer)`,
    `  Customer pays (avg):   ${money(e.price)}`,
    `  Subcontractor pay:     ${money(e.subcontractorPay)}`,
    `  Ads reserve:           ${money(e.ads)}`,
    `  Card fees:             ${money(e.paymentProcessing)}`,
    `  Insurance and admin:   ${money(e.insuranceAndAdmin)}`,
    `  Profit:                ${money(e.profit)}  (${((e.profit / e.price) * 100).toFixed(0)}%)`,
    lead.plan.id === "perVisit"
      ? ``
      : `  Based on ${PRICING.expectedVisitsPerSeason} visits a season at a ${SERVICE_TERMS.triggerCm} cm trigger. More visits than that come out of profit.`,
  ].join("\n");
}

function customerEmail(lead: Lead): string {
  return [
    `Hi ${lead.name.split(" ")[0]},`,
    ``,
    `Thanks for your snow removal request. Here is what we have:`,
    ``,
    `  Address: ${lead.address}`,
    `  Plan: ${lead.plan.name}, ${money(lead.plan.amount)} ${lead.plan.unit} plus GST`,
    `  Reference: ${lead.ref}`,
    ``,
    `Nothing has been charged. We will contact you to confirm the details and your start date.`,
    ``,
    `ClearLot Snow Removal, Regina`,
  ].join("\n");
}

/** Saves the lead to data/leads.jsonl and emails it if SMTP is configured. */
export async function deliverLead(lead: Lead): Promise<{ stored: boolean; emailed: boolean }> {
  let stored = false;
  try {
    const dir = path.join(process.cwd(), "data");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "leads.jsonl"), JSON.stringify(lead) + "\n");
    stored = true;
  } catch (err) {
    // Serverless hosts have a read-only filesystem; email is the record there.
    console.warn("[leads] could not write data/leads.jsonl:", (err as Error).message);
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, LEADS_TO_EMAIL, LEADS_FROM_EMAIL } = process.env;
  let emailed = false;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS && LEADS_TO_EMAIL) {
    const port = Number(SMTP_PORT || 465);
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    const from = `ClearLot <${LEADS_FROM_EMAIL || SMTP_USER}>`;
    await transport.sendMail({
      from,
      to: LEADS_TO_EMAIL,
      replyTo: lead.email,
      subject: `New booking: ${lead.plan.name} at ${lead.address}`,
      text: ownerEmail(lead),
    });
    emailed = true;
    // The owner has the lead at this point; a failed courtesy copy should not fail the booking.
    transport
      .sendMail({
        from,
        to: lead.email,
        replyTo: LEADS_TO_EMAIL,
        subject: `We got your snow removal request (${lead.ref})`,
        text: customerEmail(lead),
      })
      .catch((err) => console.warn("[leads] customer confirmation failed:", err.message));
  }

  if (!stored && !emailed) throw new Error("Lead could not be stored or emailed");
  return { stored, emailed };
}

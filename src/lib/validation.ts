import { z } from "zod";
import { PLAN_IDS } from "./types";

const area = z.number().finite().min(0).max(5000);

export const AreasSchema = z.object({ driveway: area, sidewalk: area, walkway: area });
export const OptionsSchema = z.object({ steps: z.boolean(), iceMelt: z.boolean() });

export const QuoteRequest = z.object({ areas: AreasSchema, options: OptionsSchema });

export const BookRequest = QuoteRequest.extend({
  plan: z.enum(PLAN_IDS),
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Enter a 10-digit phone number."),
  email: z.email().max(120),
  notes: z.string().trim().max(600).default(""),
  address: z.string().trim().min(5).max(200),
  lat: z.number().finite(),
  lng: z.number().finite(),
  measuredBy: z.enum(["ai", "ai-edited", "drawn", "typed", "demo"]),
  /** Honeypot: real people never see or fill this field. */
  company: z.string().max(0).optional(),
});

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import sharp from "sharp";
import { z } from "zod";
import { clamp01, normalizedArea } from "./geo";
import type { AnalysisResult, Point, Shape } from "./types";

export const hasClaude = () => Boolean(process.env.ANTHROPIC_API_KEY);

const SurfaceSchema = z.object({
  surfaces: z.array(
    z.object({
      type: z.enum(["driveway", "sidewalk", "walkway"]),
      points: z.array(z.object({ x: z.number(), y: z.number() })),
    }),
  ),
  image_quality: z.enum(["clear", "partly_obscured", "unusable"]),
  note: z.string(),
});

/**
 * Draws a labelled 0-100 grid over the image. Reading positions off a ruler is much more
 * reliable for a vision model than estimating raw pixel coordinates.
 */
export async function withGrid(image: Buffer): Promise<Buffer> {
  const size = 1280;
  const lines: string[] = [];
  for (let i = 0; i <= 100; i += 5) {
    const p = (i / 100) * size;
    const major = i % 10 === 0;
    const stroke = `stroke="#fff" stroke-opacity="${major ? 0.55 : 0.22}" stroke-width="${major ? 1.5 : 1}"`;
    lines.push(`<line x1="${p}" y1="0" x2="${p}" y2="${size}" ${stroke}/>`);
    lines.push(`<line x1="0" y1="${p}" x2="${size}" y2="${p}" ${stroke}/>`);
    if (major && i > 0 && i < 100) {
      const label = (x: number, y: number, anchor: string) =>
        `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#fff" stroke="#000" stroke-width="4" paint-order="stroke">${i}</text>`;
      lines.push(label(p, 22, "middle"), label(p, size - 8, "middle"));
      lines.push(label(6, p + 7, "start"), label(size - 6, p + 7, "end"));
    }
  }
  // Crosshair on the centre, which is the geocoded address.
  lines.push(
    `<circle cx="${size / 2}" cy="${size / 2}" r="14" fill="none" stroke="#ff2d55" stroke-width="3"/>`,
    `<circle cx="${size / 2}" cy="${size / 2}" r="2.5" fill="#ff2d55"/>`,
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${lines.join("")}</svg>`;
  return sharp(image)
    .resize(size, size, { fit: "fill" })
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toBuffer();
}

const prompt = (spanM: number) => `This is an overhead satellite image of a residential street in Regina, Saskatchewan. North is up. The image covers about ${spanM.toFixed(0)} m by ${spanM.toFixed(0)} m, so one grid unit is roughly ${(spanM / 100).toFixed(2)} m.

A grid is drawn over the image with both axes labelled 0 to 100: x runs left to right, y runs top to bottom. The red circle at (50, 50) marks the address a customer entered. The house under or nearest that circle is their house, and the lot around it is their property.

We run a snow removal service and need to price clearing this one property. Outline every hard surface we would clear for this customer, as polygons in grid coordinates:

- "driveway": the customer's driveway or parking pad, from the garage or house out to the edge of the road (or to the back lane, if the garage opens onto a lane). Include the apron where it crosses the sidewalk line.
- "sidewalk": the public sidewalk that runs along the street beside this lot, only for the stretch bordering this lot. A corner lot has sidewalk on two sides; return each stretch as its own polygon. Regina homeowners must clear this by bylaw.
- "walkway": private paths on the lot, such as the path from the sidewalk or driveway to the front door.

Guidance:
- Only this customer's lot. Neighbours' driveways and the sidewalk in front of other houses are not part of the job. Lot lines usually follow fences, hedges, and the midpoint between houses.
- Do not include the road, lawn, roofs, decks, or patios in the back yard.
- Trace the real edges closely, using as many points as the shape needs. A straight rectangular driveway is four points. Estimate to one decimal place.
- Parked vehicles, tree canopies and shadows often hide part of a surface. Outline the full surface as it most likely continues underneath.
- Sidewalks here are narrow, typically 1.2 to 1.5 m wide. Keep that polygon thin rather than letting it spread into the road or lawn.
- If a surface is not there or you cannot find it, leave it out rather than guessing. The customer reviews and corrects the outlines afterwards.

Set image_quality to "clear" when the surfaces are plainly visible, "partly_obscured" when trees, shadows, snow or blur forced you to infer edges, and "unusable" when you cannot tell where the customer's surfaces are. In note, write one short sentence for the customer about anything they should double-check (for example "The driveway is partly hidden by a tree, so check its left edge"). Leave note empty if nothing needs checking.`;

export async function measureSurfaces(image: Buffer, imageSpanM: number): Promise<AnalysisResult> {
  const client = new Anthropic({ timeout: 90_000, maxRetries: 1 });
  const gridded = await withGrid(image);

  const response = await client.messages.parse({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(SurfaceSchema) },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/png", data: gridded.toString("base64") } },
          { type: "text", text: prompt(imageSpanM) },
        ],
      },
    ],
  });

  const parsed = response.parsed_output;
  if (response.stop_reason === "refusal" || !parsed) {
    return { shapes: [], source: "none", quality: "unusable", note: "" };
  }

  const maxArea = 900 / (imageSpanM * imageSpanM);
  const shapes: Shape[] = [];
  parsed.surfaces.forEach((s, i) => {
    const points: Point[] = s.points.map((p) => [clamp01(p.x / 100), clamp01(p.y / 100)]);
    const area = normalizedArea(points);
    // Drop degenerate slivers and anything implausibly large for a house lot.
    if (points.length < 3 || area * imageSpanM * imageSpanM < 0.5 || area > maxArea) return;
    shapes.push({ id: `ai-${i}`, type: s.type, points });
  });

  return {
    shapes,
    source: shapes.length ? "ai" : "none",
    quality: shapes.length ? parsed.image_quality : "unusable",
    note: parsed.note.slice(0, 240),
  };
}

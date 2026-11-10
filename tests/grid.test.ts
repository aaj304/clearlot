import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { expect, it } from "vitest";
import { withGrid } from "@/lib/analyze";

it("overlays the measuring grid without changing the image geometry", async () => {
  const source = await sharp(await readFile("public/demo-lot.svg")).png().toBuffer();
  const meta = await sharp(await withGrid(source)).metadata();
  expect([meta.format, meta.width, meta.height]).toEqual(["png", 1280, 1280]);
});

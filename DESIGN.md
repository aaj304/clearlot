# ClearLot YQR design

Made with the unslop skill by Damir Sokolovsky (@heydamir), CC BY 4.0.

## Direction: the site plan

- **Product:** ClearLot YQR clears Regina driveways, sidewalks and walkways within 24 hours, priced up front from the size of the property.
- **Character:** exact, dependable, neighbourly.
- **World:** a contractor's work order and a city site plan. Off-white paper, navy ink, and the high-visibility orange of snowplows and safety vests.
- **Moment:** the site plan (`src/lot.mjs`). Property lines, a north arrow, hatched footprints, and each chosen surface inked in orange with a dimension line.
- **Signature:** the numbered work order (`workOrder` in `src/ui.mjs`), with an orange top edge like a carbon copy. It shows the job line by line, the total, the monthly option and the "Cleared by" time. It appears in the hero, the booking and the thank-you page, and nowhere else.

## Tokens (`src/assets/style.css`)

| Token | Value | Use |
|---|---|---|
| `--paper` / `--sheet` / `--card` | `#f6f4ef` / `#fbfaf6` / `#ffffff` | Page, drawing sheet, cards |
| `--ink` / `--ink-2` / `--muted` | `#17253a` / `#44516a` / `#5b6577` | The three text roles |
| `--orange` | `#ef6a22` | Surfaces on the plan, the work order edge, the current booking step. Never under text |
| `--orange-ink` | `#a8430b` | Orange as text: eyebrows, step numbers, the "Cleared by" time |
| `--navy` | `#17253a` | Primary buttons, the promise band, the footer |

- Type: Newsreader (serif, 500) for headlines and big figures; Public Sans for everything else. Body 19px for older readers.
- Rules instead of boxes: sections and lists start with a 1.5px ink rule, like a printed form.
- Buttons 56px tall (60px in the booking), radius 8. Cards radius 12. The sheet radius 4.
- One easing curve, `cubic-bezier(0.22, 1, 0.36, 1)`. The only motion is surfaces inking onto the plan and a short rise when a booking step appears.

# ClearLot YQR design

Made with the unslop skill by Damir Sokolovsky (@heydamir), CC BY 4.0.

## Direction

- **Product:** ClearLot YQR clears Regina driveways, sidewalks and walkways within 24 hours of a booking, for homeowners who can't or shouldn't shovel, especially older residents and the family who book for them.
- **Character:** steady, neighbourly, plain-spoken.
- **World:** a Regina winter morning. Flat prairie light, fresh snow, a driveway cleared down to dark pavement with crisp edges.
- **Moment:** an overhead drawing of a house on a snowy lot (`src/lot.mjs`). In the booking, each part clears as the customer picks it.
- **Signature:** the "Cleared by" ticket, which turns the 24-hour promise into a real time. It appears in the hero, the booking and the thank-you page, and nowhere else.

## Tokens (`src/assets/style.css`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f3f6f9` | Page, snow |
| `--card` | `#ffffff` | Cards, inputs |
| `--raised` | `#e8edf2` | Hover, active nav |
| `--text` / `--text-2` / `--muted` | `#14212e` / `#3f4f61` / `#54637a` | The three text roles |
| `--accent` | `#f2a71b` | Plow-light amber. Primary buttons and the current booking step only. Dark text on it |
| `--accent-ink` | `#7a4b00` | Amber used as text on light backgrounds |
| `--night` | `#15212d` | Promise band, footer, closing call to action |

- Type: Figtree, self-hosted. Body 19px for older readers. Weights 400 to 600.
- Buttons 56px tall (60px in the booking), radius 10. Cards radius 16, panels radius 20.
- One easing curve, `cubic-bezier(0.22, 1, 0.36, 1)`. The only motion is the drawing clearing and a short rise when a booking step appears.

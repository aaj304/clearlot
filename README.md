# ClearLot

Snow removal for Regina homes, priced from the customer's address.

A customer types their address, the site pulls Google's latest satellite image of the property,
Claude outlines and measures the driveway, city sidewalk and walkway, the customer corrects the
outlines if needed, and the site prices three plans from the measured area. Booking requests are
emailed to you with the subcontractor payout and your margin for that job.

## Run it

```bash
npm install
npm run dev
```

With no keys set the site runs in **demo mode**: a sample property with sample outlines, so the
whole flow can be tried straight away.

## Go live

Copy `.env.example` to `.env.local` and fill it in.

| Variable | What it does | Without it |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Address search and satellite imagery. Enable **Places API (New)** and **Maps Static API** on the key. | Demo mode |
| `ANTHROPIC_API_KEY` | AI measurement of the satellite image | Customers outline surfaces by hand |
| `SMTP_*`, `LEADS_TO_EMAIL` | Emails each booking to you, plus a confirmation to the customer | Bookings are only written to `data/leads.jsonl` |
| `NEXT_PUBLIC_BUSINESS_PHONE` / `_EMAIL` | Contact details in the header and footer | Hidden |

Both API keys stay on the server. The browser never sees them, and never sees your margins.

Deploy anywhere that runs Next.js (Vercel, or a Node host: `npm run build && npm start`). On
serverless hosts the filesystem is read-only, so set up SMTP: email is then the record of each lead.

## Where to change things

| To change | Edit |
|---|---|
| Subcontractor rates, ad budget, profit target, plan discounts, GST | `src/lib/pricing.ts` |
| Snowfall trigger, clearing time promise, season dates, business name | `src/lib/site.ts` |
| Service area boundary | `src/lib/geo.ts` |
| Instructions given to the AI when measuring | `src/lib/analyze.ts` |
| Colours, type, buttons | `src/app/globals.css` (roles described in `DESIGN.md`) |

Run `npm test` after changing prices. It fails if any plan stops being profitable.

## How a price is built

```
subcontractor pay per visit = $15 call-out + area x rate per m² (+ steps, + ice melt)
price per visit             = subcontractor pay / (1 - ads 12% - card fees 3% - admin 5% - profit 22%)
full season                 = price per visit x 16 expected visits, less 10%
monthly                     = price per visit x 16 expected visits, less 5%, over 5 months
single visit                = price per visit + 15%
```

See `docs/LAUNCH.md` for the business side: unit economics, risks and a launch checklist.

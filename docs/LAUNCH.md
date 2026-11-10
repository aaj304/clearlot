# Launching ClearLot

The site is the storefront. This is what has to be true behind it.

## Unit economics (example property)

Double driveway (712 sq ft), 15 m of city sidewalk, front walkway. Numbers come from
`src/lib/pricing.ts` and are starting assumptions, not market research: replace them with real
subcontractor quotes before launch.

| Per visit | Amount |
|---|---|
| Customer pays (standard visit price) | $66.00 |
| Subcontractor | $37.85 |
| Ads reserve (12%) | $7.92 |
| Card fees (3%) | $1.98 |
| Insurance and admin (5%) | $3.30 |
| **Profit** | **$14.95 (23%)** |

| Plan | Customer pays | Revenue per visit at 16 visits | Profit per visit |
|---|---|---|---|
| Full season | $955 | $59.69 | about $9.90 |
| Monthly | $201 x 5 | $62.81 | about $12.40 |
| Single visit | $76 | $76.00 | about $22.95 |

### The risk that matters: a heavy winter

Season and monthly customers pay a fixed price, but you pay the subcontractor per visit. On the
example property a full-season customer brings in $955. After the 20% overhead reserve that leaves
$764 to pay for visits at $37.85 each, so **the plan breaks even at about 20 visits**. More
snowfalls than that and you lose money on that customer.

Ways to protect yourself, in order of preference:

1. **Pay subcontractors a flat seasonal rate per property** rather than per visit. The risk moves
   to the person who controls the cost, and your margin is locked in. Many operators prefer it for
   the guaranteed income.
2. Check `expectedVisitsPerSeason` (16) against Environment Canada snowfall records for Regina at
   your trigger depth, and raise it if the long-run average is higher.
3. Raise the trigger from 3 cm to 5 cm, which cuts visits substantially.
4. Add a visit cap to the season terms, with extra visits billed at the single-visit price. If you
   do, change the FAQ and plan wording on the site, which currently promise a fixed price.

## Before you take the first booking

- [ ] **Subcontractors signed**, with written agreements covering rates, response time, proof of
      their own liability insurance and WCB coverage, and what happens on a no-show.
- [ ] **Backup operator** for each area of the city. One sick operator after a big snowfall should
      not break the 24-hour promise.
- [ ] **Commercial general liability insurance** in the business's name. Slip-and-fall claims land
      on whoever the customer contracted with, which is you.
- [ ] **Business registration and City of Regina business licence**. Ask your accountant about GST
      registration (required past $30,000 in revenue; the site already charges 5% GST) and confirm
      how PST applies to your services.
- [ ] **Service promises confirmed** with the operators: the site says every snowfall of 3 cm or
      more is cleared within 24 hours of the snow stopping. Edit `src/lib/site.ts` if they can't
      commit to that.
- [ ] **Sidewalk bylaw wording checked** against the City of Regina's current rules. The site says
      residents must clear the public sidewalk beside their property.
- [ ] **Customer terms** written: what's included, where snow gets piled, damage policy, refunds
      and cancellation, what happens when cars block the driveway.
- [ ] **Privacy policy** page added. The form collects names, phones, emails and addresses.
- [ ] **Google imagery terms reviewed.** Google Maps Platform terms restrict extracting or deriving
      data from its imagery. Many measurement tools work this way, but read section 3.2.3 of the
      terms or ask Google before you scale. If it is a problem, the imagery source is isolated in
      `src/lib/google.ts` and can be swapped for a licensed aerial provider or city orthophotos.
- [ ] **A way to take payment** (e-transfer to start; Stripe or Square once volume justifies it).

## Launch sequence

1. Sign two or three operators and agree rates. Update `pricing.ts` with their real numbers.
2. Add the API keys and SMTP settings, deploy, and point the domain at it.
3. Run ten real addresses you know through the site and compare the measurements with a tape
   measure or Google Maps' own measure tool. Adjust the AI instructions if a pattern shows up.
4. Start Google Ads on "snow removal Regina" and neighbourhood keywords in October, with the
   address box as the landing page. Add a Google Business Profile.
5. Sell full-season plans hard before the first snowfall: that cash pays for ads and deposits.
6. Route each booking email to the operator for that area. The email shows the measured areas and
   the payout for the job.

## Costs per quote

Each completed measurement costs roughly a few cents: one satellite image, a handful of address
lookups and one AI call. The server caches repeat lookups of the same address and limits how many
measurements one visitor can run per hour (`src/lib/ratelimit.ts`).

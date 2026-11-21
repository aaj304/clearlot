# ClearLot YQR

Website for ClearLot YQR, snow removal in Regina. Plain HTML pages and one PHP booking script,
so it runs on any Hostinger plan.

The folder **`public_html/`** is the finished website. That is what you upload.

## Pages

| Page | Address | Aimed at searches like |
|---|---|---|
| Home | `/` | snow removal Regina |
| Booking | `/book/` | (where every ad and button leads) |
| Driveways | `/driveway-snow-removal/` | driveway snow removal Regina |
| Sidewalks | `/sidewalk-snow-removal/` | sidewalk snow removal Regina, corner lot |
| Seniors | `/snow-removal-for-seniors/` | snow removal for seniors Regina |
| Prices | `/prices/` | snow removal prices Regina |
| Areas | `/areas-we-serve/` | snow removal Harbour Landing, Lakeview… |
| Questions | `/faq/` | |
| Contact, Privacy | `/contact/`, `/privacy/` | |
| Thank you | `/thank-you/` | hidden from Google; counts ad conversions |

## Before launch: fill in your details

The repository is public, so settings are split in two files.

1. **`site.config.json`** (public, committed): things shown on the site.
   - `phone`: shown on every page, e.g. `"(306) 555-0123"`. Call buttons stay hidden until it's set.
   - `publicEmail`: shown on the contact page.
   - `siteUrl`: your real domain, e.g. `"https://clearlotyqr.ca"`.
   - `googleAdsId`, `bookingConversionLabel`, `callConversionLabel`: from Google Ads, see below.
2. **`site.private.json`** (private, never committed; listed in `.gitignore`):
   - `bookingEmail`: where every booking is sent.
   - `googleMapsApiKey`: turns on Regina address suggestions in the booking form (see below).
   - `fromEmail`: the address emails come from. Leave empty to use `bookings@` your website's domain.
   - `smtpHost`, `smtpPort`, `smtpUser`, `smtpPass`, `smtpSecure`: optional, for reliable email (see below).
3. **`prices.json`**: set the one-time prices here. Whole-winter prices are worked out from them: one-time price × `visitsPerMonth` (3) × `months` (5), so 15 visits.
4. Rebuild: `node build.mjs`. This regenerates `public_html/`.

The private values go only into `public_html/api/config.php`, which the server runs but never shows,
and which is also kept out of git. The first booking or address lookup copies them to
`clearlot-bookings/settings.json` above `public_html`, so a later upload without them keeps working.

## Emails

Every booking sends two emails:

- **To you** (`bookingEmail`): the work order, address with a map link, customer details and notes.
  Reply goes straight to the customer.
- **To the customer**: their work order with prices and GST, the "cleared by" time, and what happens next.
  The email field in the booking form is required for this.

By default the server's built-in mail sends them. That works without setup but can land in spam,
especially from a temporary `hostingersite.com` address. For reliable delivery, create a mailbox on your
own domain (hPanel → Emails), then add to `site.private.json`:

```json
"smtpHost": "smtp.hostinger.com", "smtpPort": "465", "smtpSecure": "ssl",
"smtpUser": "bookings@yourdomain.ca", "smtpPass": "the mailbox password"
```

## Address suggestions (Google)

1. In Google Cloud Console, create a project with billing turned on.
2. Enable **Places API (New)**.
3. Create an API key. Under API restrictions, allow only Places API (New).
4. Put it in `site.private.json` as `googleMapsApiKey`, rebuild and upload.

Where the key lives on Hostinger: only in `clearlot-bookings/settings.json`, one folder above
`public_html` (File Manager → the site's domain folder). Never paste it into `address.php` or any
other file in `public_html`: those are replaced on every upload, and an edit there can break the page.
To change the key, edit `"googleMapsApiKey"` in that settings file.

The key stays on the server: the browser asks `/api/address.php`, which asks Google and only returns
addresses inside Regina. Without a key the address box works as a normal text field.

## Upload to Hostinger

1. hPanel → **Websites** → your domain → **File Manager**.
2. Open the `public_html` folder. Delete the default `default.php` or `index.php` if there is one.
3. Upload `clearlot-yqr-website.zip`, right-click it → **Extract** into `public_html`, then delete the zip.
   You should see `index.html`, `book`, `assets`, `api` and the other folders directly inside `public_html`.
4. hPanel → **Security → SSL**: turn on the free SSL certificate.
5. Open your domain and make a test booking with your own phone number. You should get the email.

Bookings are emailed to `bookingEmail` and also saved to a file named `clearlot-bookings/bookings.jsonl`,
one folder above `public_html`, where the public can't reach it. Hostinger's File Manager can open it.

## Google Ads

1. In Google Ads, create a conversion action for **website bookings**. Copy the ID (`AW-…`) and the label into `site.config.json`.
2. Optionally create a second conversion for **phone calls from the website** and add its label as `callConversionLabel`.
3. Rebuild and upload. A booking counts when someone reaches the thank-you page; a call counts when someone taps a phone number.
4. Point ads to the page that matches the search: driveway ads to `/driveway-snow-removal/`, seniors ads to `/snow-removal-for-seniors/`, general ads to `/`.

Then add the site to **Google Search Console** and submit `https://yourdomain/sitemap.xml`.

## Editing

| To change | Edit |
|---|---|
| Prices, season dates, snowfall trigger, visits per month for the winter price | `prices.json` |
| Phone, emails, domain, Google Ads | `site.config.json` |
| Option names and descriptions | `src/catalog.mjs` |
| Page text | `src/pages.mjs` |
| Colours, sizes | `src/assets/style.css` (see `DESIGN.md`) |
| The house drawing | `src/lot.mjs` |

To test locally: `node build.mjs`, then `cd public_html && php -S localhost:8000`.

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

1. **`site.config.json`**
   - `phone`: shown on every page, e.g. `"(306) 555-0123"`. The call buttons stay hidden until this is set.
   - `publicEmail`: shown on the contact page.
   - `bookingEmail`: where bookings are sent. Never shown on the site.
   - `fromEmail`: an email address on your own domain (create it in Hostinger → Emails). Booking emails are sent from it.
   - `siteUrl`: your real domain, e.g. `"https://clearlotyqr.ca"`.
   - `googleAdsId`, `bookingConversionLabel`, `callConversionLabel`: from Google Ads, see below.
2. **`prices.json`**: the prices are **starting estimates**. Change them to your real prices, then delete the `_read_me` line.
3. Rebuild: `node build.mjs`. This regenerates `public_html/`.

No Node.js? Send the details to Claude to rebuild, or edit `public_html/api/config.php` on
Hostinger directly for the booking emails (the phone number on the pages needs a rebuild).

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
| Prices, season dates, snowfall trigger | `prices.json` |
| Phone, emails, domain, Google Ads | `site.config.json` |
| Option names and descriptions | `src/catalog.mjs` |
| Page text | `src/pages.mjs` |
| Colours, sizes | `src/assets/style.css` (see `DESIGN.md`) |
| The house drawing | `src/lot.mjs` |

To test locally: `node build.mjs`, then `cd public_html && php -S localhost:8000`.

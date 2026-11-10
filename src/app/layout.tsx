import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "ClearLot | Snow removal in Regina, priced from your address",
    template: "%s | ClearLot",
  },
  description:
    "Enter your Regina address and get an exact snow removal price in about a minute. We measure your driveway, sidewalk and walkway from satellite imagery, and you confirm the outlines.",
  openGraph: {
    title: "ClearLot | Snow removal in Regina, priced from your address",
    description: "Driveway, city sidewalk and walkway cleared after every snowfall. See your exact price online.",
    locale: "en_CA",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#0f1a24" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-paper focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

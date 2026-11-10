import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer, Logo } from "@/components/Brand";
import { QuoteFlow } from "@/components/QuoteFlow";
import { SERVICE, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Get your price",
  description: "Measure your driveway, sidewalk and walkway from a satellite image and see your snow removal price.",
};

export default function QuotePage() {
  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="wrap flex h-16 items-center justify-between">
          <Logo />
          {SITE.phone && (
            <a className="text-sm font-semibold underline" href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`}>
              {SITE.phone}
            </a>
          )}
        </div>
      </header>
      <main id="main" className="wrap min-h-[70vh] py-8 sm:py-12">
        <Suspense fallback={<p className="text-ink-soft">Loading…</p>}>
          <QuoteFlow triggerCm={SERVICE.triggerCm} clearWithinHours={SERVICE.clearWithinHours} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

import Link from "next/link";
import { SITE } from "@/lib/site";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label={`${SITE.name} home`}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill="#ff6a1a" />
        <path d="M6 20h16M8 20V11l6-4.5 6 4.5v9" fill="none" stroke="#1c0d03" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 20v-5h4v5" fill="none" stroke="#1c0d03" strokeWidth="2.2" strokeLinejoin="round" />
      </svg>
      <span className={`font-display text-xl font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        {SITE.name}
      </span>
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="wrap flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-ink-soft">
            Residential snow removal in {SITE.city}, Saskatchewan. Priced from your address, cleared by local operators.
          </p>
        </div>
        <div className="text-sm text-ink-soft">
          {SITE.phone && (
            <p>
              Call or text{" "}
              <a className="font-semibold text-ink underline" href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`}>
                {SITE.phone}
              </a>
            </p>
          )}
          {SITE.email && (
            <p className="mt-1">
              <a className="font-semibold text-ink underline" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </p>
          )}
          <p className="mt-3 text-ink-faint">Satellite imagery © Google. Prices in Canadian dollars, plus GST.</p>
        </div>
      </div>
    </footer>
  );
}

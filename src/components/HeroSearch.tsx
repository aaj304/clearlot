"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddressSearch } from "./AddressSearch";

export function HeroSearch({ cta }: { cta?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <AddressSearch
      cta={cta}
      busy={busy}
      onPick={(a) => {
        setBusy(true);
        router.push(`/quote?place=${encodeURIComponent(a.placeId)}&session=${encodeURIComponent(a.session)}`);
      }}
    />
  );
}

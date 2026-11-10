"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface PickedAddress {
  placeId: string;
  label: string;
  session: string;
}

interface Suggestion {
  placeId: string;
  main: string;
  secondary: string;
}

const newSession = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());

export function AddressSearch({
  onPick,
  cta = "Measure my property",
  busy = false,
  autoFocus = false,
}: {
  onPick: (address: PickedAddress) => void;
  cta?: string;
  busy?: boolean;
  autoFocus?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState<Suggestion | null>(null);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  const session = useRef("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    session.current = newSession();
  }, []);

  useEffect(() => {
    if (picked && query === picked.main) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/address/suggest?q=${encodeURIComponent(query)}&session=${session.current}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setDemo(Boolean(data.demo));
        setSuggestions(data.suggestions ?? []);
        setActive(0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setSuggestions([]);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, picked]);

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  function choose(s: Suggestion) {
    setPicked(s);
    setQuery(s.main);
    setOpen(false);
    setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const choice = picked ?? (suggestions.length === 1 ? suggestions[0] : null);
    if (!choice) {
      setError(
        suggestions.length ? "Pick your address from the list." : "Start typing your street address, then pick it from the list.",
      );
      setOpen(suggestions.length > 0);
      return;
    }
    onPick({ placeId: choice.placeId, label: choice.main, session: session.current });
  }

  const showList = open && suggestions.length > 0;

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        Your Regina address
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div ref={boxRef} className="relative flex-1">
          <input
            id={id}
            className="field text-ink"
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={showList ? `${id}-opt-${active}` : undefined}
            aria-describedby={error ? `${id}-err` : undefined}
            aria-invalid={Boolean(error)}
            autoComplete="off"
            autoFocus={autoFocus}
            placeholder="e.g. 2420 Albert St"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPicked(null);
              setOpen(true);
              setError("");
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (!showList) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => (a + 1) % suggestions.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
              } else if (e.key === "Enter") {
                e.preventDefault();
                choose(suggestions[active]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          {showList && (
            <ul
              id={`${id}-list`}
              role="listbox"
              className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-[10px] border border-line bg-paper text-left text-ink shadow-card"
            >
              {suggestions.map((s, i) => (
                <li
                  key={s.placeId}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`flex min-h-12 cursor-pointer flex-col justify-center px-3.5 py-2 ${i === active ? "bg-ice" : ""}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(s)}
                >
                  <span className="font-semibold">{s.main}</span>
                  <span className="text-sm text-ink-soft">{s.secondary}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="btn btn-primary shrink-0" disabled={busy}>
          {busy ? "Loading…" : cta}
        </button>
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-2 text-sm font-semibold text-accent">
          {error}
        </p>
      )}
      {demo && !error && (
        <p className="mt-2 text-sm opacity-80">
          Demo mode: pick one of the sample properties. Real addresses work once the Google Maps key is added.
        </p>
      )}
    </form>
  );
}

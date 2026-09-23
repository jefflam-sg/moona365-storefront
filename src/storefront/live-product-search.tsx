"use client";

/* eslint-disable @next/next/no-img-element -- suggestion image URLs pass the storefront image-source boundary. */
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { StorefrontIcon } from "./icons";
import { safeImageSource } from "./safe-values";

type Suggestion = { id: string; slug: string; name: string; image: { src: string; alt: string } | null };

function isSuggestion(value: unknown): value is Suggestion {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.slug !== "string" || typeof item.name !== "string") return false;
  if (item.image === null) return true;
  if (!item.image || typeof item.image !== "object") return false;
  const image = item.image as Record<string, unknown>;
  return typeof image.src === "string" && Boolean(safeImageSource(image.src)) && typeof image.alt === "string";
}

export function LiveProductSearch({ preview }: { preview: boolean }) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const requestNumber = useRef(0);

  useEffect(() => {
    const term = query.trim();
    setActive(-1);
    if (preview || term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const current = ++requestNumber.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(term)}`, { headers: { Accept: "application/json" }, signal: controller.signal });
        const payload: unknown = response.ok ? await response.json() : null;
        const values = payload && typeof payload === "object" && Array.isArray((payload as { suggestions?: unknown }).suggestions)
          ? (payload as { suggestions: unknown[] }).suggestions.filter(isSuggestion)
          : [];
        if (current === requestNumber.current) { setSuggestions(values); setOpen(true); }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError") && current === requestNumber.current) setSuggestions([]);
      } finally {
        if (current === requestNumber.current) setLoading(false);
      }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [preview, query]);

  const visible = open && query.trim().length >= 2;
  const chooseActive = () => {
    const selected = suggestions[active];
    if (!selected) return false;
    window.location.assign(`/products/${selected.slug}`);
    return true;
  };

  return <div className="sf-live-search" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <form className="sf-header-search" role="search" action="/search" onSubmit={(event) => { if (preview || chooseActive()) event.preventDefault(); }}>
      <label><span className="sf-visually-hidden">Search products</span><input
        name="q" type="search" value={query} placeholder="Search for products…" autoComplete="off"
        role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && suggestions.length) { event.preventDefault(); setOpen(true); setActive((value) => (value + 1) % suggestions.length); }
          else if (event.key === "ArrowUp" && suggestions.length) { event.preventDefault(); setOpen(true); setActive((value) => value <= 0 ? suggestions.length - 1 : value - 1); }
          else if (event.key === "Escape") { setOpen(false); setActive(-1); }
        }}
      /></label>
      <button type="submit" aria-label="Search"><StorefrontIcon name="search" /><span>Search</span></button>
    </form>
    {visible && <div className="sf-search-suggestions" id={listId} role="listbox" aria-label="Product suggestions">
      {loading && <p className="sf-search-message" role="status">Searching…</p>}
      {!loading && suggestions.map((suggestion, index) => {
        const image = suggestion.image && safeImageSource(suggestion.image.src);
        return <Link id={`${listId}-${index}`} key={suggestion.id} role="option" aria-selected={active === index} href={`/products/${suggestion.slug}`} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setOpen(false)}>
          <span className="sf-search-thumb">{image ? <img src={image} alt="" /> : null}</span><span>{suggestion.name}</span><b aria-hidden="true">→</b>
        </Link>;
      })}
      {!loading && suggestions.length === 0 && <p className="sf-search-message" role="status">No matching products</p>}
    </div>}
  </div>;
}

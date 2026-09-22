"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { PublicFilterConfiguration, PublicProductListing } from "./contracts";

type Item = PublicFilterConfiguration["filterSet"]["items"][number];
type Query = {
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  filters: Record<string, string[]>;
};

export function ProductFilterPanel({ items, facets, query }: {
  items: Item[];
  facets: PublicProductListing["facets"];
  query: Query;
}) {
  const router = useRouter();
  const current = useSearchParams();
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const facetMap = new Map(facets.map((facet) => [facet.key, facet.values]));

  const navigate = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(current.toString());
    mutate(params);
    params.delete("page");
    startTransition(() => router.push(params.size ? `?${params}` : "?", { scroll: false }));
  };
  const keyFor = (item: Item) => item.key.startsWith("specification:") ? item.key.slice(14) : item.key;
  const clearKey = (key: string) => navigate((params) => params.delete(`f.${key}`));
  const toggle = (key: string, value: string, multiple: boolean) => navigate((params) => {
    const selected = new Set((params.get(`f.${key}`) ?? "").split(",").filter(Boolean));
    if (selected.has(value)) selected.delete(value);
    else {
      if (!multiple) selected.clear();
      selected.add(value);
    }
    if (selected.size) params.set(`f.${key}`, [...selected].join(","));
    else params.delete(`f.${key}`);
  });
  const clearAll = () => navigate((params) => {
    [...params.keys()].forEach((key) => {
      if (key.startsWith("f.") || ["minPrice", "maxPrice", "inStock"].includes(key)) params.delete(key);
    });
  });
  const active = Object.values(query.filters).reduce((sum, values) => sum + values.length, 0) +
    Number(Boolean(query.minPrice || query.maxPrice)) + Number(query.inStock);

  return <div className="sf-filter-panel">
    <div className="sf-filter-title"><h2>Filter By</h2>{active > 0 && <button type="button" onClick={clearAll}>Clear all</button>}</div>
    <div className="sf-filter-groups">
      {items.map((item) => {
        const key = keyFor(item);
        if (["PRICE", "IN_STOCK"].includes(item.sourceType)) return null;
        const values = facetMap.get(key) ?? [];
        const selected = new Set(query.filters[key] ?? []);
        if (!values.length && !selected.size) return null;
        const limit = item.maxInitiallyVisible || 5;
        const isExpanded = expanded[key] ?? false;
        const visible = isExpanded ? values : values.slice(0, limit);
        return <fieldset className="sf-facet" key={key}>
          <legend>{item.customerLabel}</legend>
          <div className="sf-facet-options">{visible.map((entry) => <label key={entry.value}>
            <input type={item.multipleSelection ? "checkbox" : "radio"} name={`f.${key}`} checked={selected.has(entry.value)} onChange={() => toggle(key, entry.value, item.multipleSelection)} />
            <span>{entry.label}</span>{item.showProductCount && <b>({entry.count})</b>}
          </label>)}</div>
          {values.length > limit && <button className="sf-facet-more" type="button" onClick={() => setExpanded((state) => ({ ...state, [key]: !isExpanded }))} aria-expanded={isExpanded}><span aria-hidden="true">⌄</span>{isExpanded ? "See Less" : "See More"}</button>}
          {selected.size > 0 && <button className="sf-facet-clear" type="button" onClick={() => clearKey(key)}><span aria-hidden="true">‹</span>Clear Selection</button>}
        </fieldset>;
      })}
      {items.some((item) => item.sourceType === "PRICE") && <fieldset className="sf-facet"><legend>Price</legend><div className="sf-price-inputs">
        <label><span>Min</span><input inputMode="decimal" defaultValue={query.minPrice} placeholder="$ 0" onBlur={(event) => navigate((params) => event.currentTarget.value ? params.set("minPrice", event.currentTarget.value) : params.delete("minPrice"))} /></label>
        <label><span>Max</span><input inputMode="decimal" defaultValue={query.maxPrice} placeholder="Any" onBlur={(event) => navigate((params) => event.currentTarget.value ? params.set("maxPrice", event.currentTarget.value) : params.delete("maxPrice"))} /></label>
      </div></fieldset>}
      {items.some((item) => item.sourceType === "IN_STOCK") && <fieldset className="sf-facet"><label className="sf-filter-toggle"><span>In Stock Only</span><input type="checkbox" checked={query.inStock} onChange={(event) => navigate((params) => event.currentTarget.checked ? params.set("inStock", "true") : params.delete("inStock"))} /></label></fieldset>}
    </div>
  </div>;
}

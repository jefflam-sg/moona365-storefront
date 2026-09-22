import Link from "next/link";
import type { PublicCategory, PublicFilterConfiguration, PublicProductListing } from "./contracts";
import { categoryHref } from "./category-url";
import { ProductCard } from "./catalogue-page";
import { ListingSort } from "./listing-sort";
import { ProductFilterPanel } from "./product-filter-panel";

/* Public catalogue image URLs are validated by the backend response contract. */
/* eslint-disable @next/next/no-img-element */

export type ListingQuery = { page?: string; sort?: string; minPrice?: string; maxPrice?: string; inStock?: string; q?: string; [key: string]: string | string[] | undefined };
type Query = ReturnType<typeof normalizedListingQuery>;
type Filters = PublicFilterConfiguration["filterSet"]["items"];
const sorts = new Set(["featured", "newest", "name-asc", "name-desc", "price-asc", "price-desc"]);

export function normalizedListingQuery(query: ListingQuery) {
  const requestedPage = Number(query.page ?? "1");
  const price = (value?: string) => /^\d+(?:\.\d{1,2})?$/.test(value ?? "") ? value! : "";
  const filters: Record<string, string[]> = {};
  for (const [rawKey, rawValue] of Object.entries(query)) {
    if (!rawKey.startsWith("f.") || typeof rawValue !== "string") continue;
    const key = rawKey.slice(2);
    if (!/^(category|brand|[a-z0-9][a-z0-9_-]{0,79})$/.test(key)) continue;
    const values = rawValue.split(",").filter((value) => /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value)).slice(0, 30);
    if (values.length) filters[key] = [...new Set(values)];
  }
  const q = typeof query.q === "string" ? query.q : "";
  const sort = typeof query.sort === "string" ? query.sort : "";
  return { page: Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100 ? requestedPage : 1, sort: sorts.has(sort) ? sort : "featured", minPrice: price(typeof query.minPrice === "string" ? query.minPrice : undefined), maxPrice: price(typeof query.maxPrice === "string" ? query.maxPrice : undefined), inStock: query.inStock === "true", q: q.trim().slice(0, 120), filters };
}

function hrefWith(basePath: string, query: Query, changes: Record<string, string | null>) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.sort !== "featured") params.set("sort", query.sort);
  if (query.minPrice) params.set("minPrice", query.minPrice);
  if (query.maxPrice) params.set("maxPrice", query.maxPrice);
  if (query.inStock) params.set("inStock", "true");
  Object.entries(query.filters).forEach(([key, values]) => values.length && params.set(`f.${key}`, values.join(",")));
  if (query.page > 1) params.set("page", String(query.page));
  Object.entries(changes).forEach(([key, value]) => value === null ? params.delete(key) : params.set(key, value));
  return basePath + (params.size ? "?" + params : "");
}

export function ProductListingPage({ title, description, eyebrow, basePath, query, listing, filters, breadcrumbs = [], childCategories = [], headingStyle = "banner", headingImage = null }: { title: string; description?: string; eyebrow: string; basePath: string; query: Query; listing: PublicProductListing; filters: Filters; breadcrumbs?: Array<{ label: string; href?: string }>; childCategories?: PublicCategory[]; headingStyle?: "banner" | "plain"; headingImage?: PublicCategory["image"] }) {
  const availableFilters = filters.filter((item) => ["CATEGORY", "BRAND", "SPECIFICATION", "PRICE", "IN_STOCK"].includes(item.sourceType));
  const priceEnabled = filters.some((item) => item.sourceType === "PRICE");
  const stockEnabled = filters.some((item) => item.sourceType === "IN_STOCK");
  const activeCount = Object.values(query.filters).reduce((sum, values) => sum + values.length, 0) + Number(priceEnabled && Boolean(query.minPrice || query.maxPrice)) + Number(stockEnabled && query.inStock);
  const facetLabels = new Map((listing.facets ?? []).flatMap((facet) => facet.values.map((value) => [`${facet.key}\0${value.value}`, value.label])));
  const clearAllChanges = Object.fromEntries([...Object.keys(query.filters).map((key) => [`f.${key}`, null]), ["minPrice", null], ["maxPrice", null], ["inStock", null], ["page", null]]) as Record<string, null>;
  const pages = Array.from({ length: listing.pagination.pageCount }, (_, index) => index + 1).filter((page) => page === 1 || page === listing.pagination.pageCount || Math.abs(page - query.page) <= 2);
  return <>
    <nav className="sf-breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link>{breadcrumbs.map((item) => <span key={item.label + "-" + (item.href ?? "current")}>›{item.href ? <Link href={item.href}>{item.label}</Link> : <b>{item.label}</b>}</span>)}</nav>
    {availableFilters.length > 0 && <div className="sf-plp-mobile-actions"><details><summary>Filters{activeCount ? " (" + activeCount + ")" : ""}</summary><ProductFilterPanel items={availableFilters} facets={listing.facets ?? []} query={query} /></details><SortForm basePath={basePath} query={query} compact /></div>}
    <div className="sf-plp-layout" data-no-filters={availableFilters.length === 0}>
      {availableFilters.length > 0 && <aside className="sf-filter-sidebar"><ProductFilterPanel items={availableFilters} facets={listing.facets ?? []} query={query} /></aside>}
      <div className="sf-plp-main"><header className="sf-plp-heading" data-style={headingStyle} data-has-image={Boolean(headingStyle === "banner" && headingImage)} data-category-banner={Boolean(eyebrow === "CATEGORY" && headingStyle === "banner" && headingImage)}><div>{headingStyle === "banner" && eyebrow !== "CATEGORY" && <span className="sf-eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{headingStyle === "banner" && headingImage && <img src={headingImage.src} alt={headingImage.alt} />}</header>
      {childCategories.length > 0 && <nav className="sf-child-categories" aria-label={title + " categories"}>{childCategories.map((category) => <Link key={category.id} href={categoryHref(category)}>{category.image ? <img src={category.image.src} alt="" /> : <span aria-hidden="true" />}{category.name}</Link>)}</nav>}
      <section className="sf-plp-results"><div className="sf-plp-toolbar"><strong>{listing.pagination.total} product{listing.pagination.total === 1 ? "" : "s"}</strong><SortForm basePath={basePath} query={query} /></div>
        {activeCount > 0 && <div className="sf-active-filters">{Object.entries(query.filters).flatMap(([key, values]) => values.map((value) => <Link key={`${key}-${value}`} href={hrefWith(basePath, query, { [`f.${key}`]: values.filter((item) => item !== value).join(",") || null, page: null })}>{facetLabels.get(`${key}\0${value}`) ?? value} ×</Link>))}{priceEnabled && (query.minPrice || query.maxPrice) && <Link href={hrefWith(basePath, query, { minPrice: null, maxPrice: null, page: null })}>{"$" + (query.minPrice || "0") + "–$" + (query.maxPrice || "Any") + " ×"}</Link>}{stockEnabled && query.inStock && <Link href={hrefWith(basePath, query, { inStock: null, page: null })}>In stock ×</Link>}<Link className="sf-clear-filters" href={hrefWith(basePath, query, clearAllChanges)}>Clear all</Link></div>}
        {listing.products.length ? <div className="sf-product-grid">{listing.products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="sf-empty">No products match these filters.</p>}
        {listing.pagination.pageCount > 1 && <nav className="sf-pagination" aria-label="Product pages">{query.page > 1 && <Link href={hrefWith(basePath, query, { page: String(query.page - 1) })}>← Previous</Link>}{pages.map((page, index) => <span key={page}>{index > 0 && page - pages[index - 1] > 1 && <i>…</i>}<Link aria-current={page === query.page ? "page" : undefined} href={hrefWith(basePath, query, { page: page === 1 ? null : String(page) })}>{page}</Link></span>)}{query.page < listing.pagination.pageCount && <Link href={hrefWith(basePath, query, { page: String(query.page + 1) })}>Next →</Link>}</nav>}
      </section></div>
    </div>
  </>;
}

function SortForm({ basePath, query, compact = false }: { basePath: string; query: Query; compact?: boolean }) {
  return <form action={basePath} className={compact ? "sf-sort-form sf-sort-form--compact" : "sf-sort-form"}>{query.q && <input type="hidden" name="q" value={query.q} />}{query.minPrice && <input type="hidden" name="minPrice" value={query.minPrice} />}{query.maxPrice && <input type="hidden" name="maxPrice" value={query.maxPrice} />}{query.inStock && <input type="hidden" name="inStock" value="true" />}{Object.entries(query.filters).map(([key, values]) => <input key={key} type="hidden" name={`f.${key}`} value={values.join(",")} />)}<ListingSort value={query.sort} /></form>;
}

import Link from "next/link";
import type { PublicCategory, PublicProductListing } from "./contracts";
import { categoryHref } from "./category-url";
import { ProductCard } from "./catalogue-page";
import { ListingSort } from "./listing-sort";

/* Public catalogue image URLs are validated by the backend response contract. */
/* eslint-disable @next/next/no-img-element */

export type ListingQuery = { page?: string; sort?: string; minPrice?: string; maxPrice?: string; inStock?: string; q?: string };
const sorts = new Set(["featured", "newest", "name-asc", "name-desc", "price-asc", "price-desc"]);
export function normalizedListingQuery(query: ListingQuery) {
  const pageNumber = Number(query.page ?? "1");
  return { page: Number.isSafeInteger(pageNumber) && pageNumber > 0 && pageNumber <= 100 ? pageNumber : 1, sort: sorts.has(query.sort ?? "") ? query.sort! : "featured", minPrice: /^\d+(?:\.\d{1,2})?$/.test(query.minPrice ?? "") ? query.minPrice! : "", maxPrice: /^\d+(?:\.\d{1,2})?$/.test(query.maxPrice ?? "") ? query.maxPrice! : "", inStock: query.inStock === "true", q: (query.q ?? "").trim().slice(0, 120) };
}

function hrefWith(basePath: string, query: ReturnType<typeof normalizedListingQuery>, changes: Record<string, string | null>) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.sort !== "featured") params.set("sort", query.sort);
  if (query.minPrice) params.set("minPrice", query.minPrice);
  if (query.maxPrice) params.set("maxPrice", query.maxPrice);
  if (query.inStock) params.set("inStock", "true");
  if (query.page > 1) params.set("page", String(query.page));
  Object.entries(changes).forEach(([key, value]) => value === null ? params.delete(key) : params.set(key, value));
  return `${basePath}${params.size ? `?${params}` : ""}`;
}

export function ProductListingPage({ title, description, eyebrow, basePath, query, listing, breadcrumbs = [], childCategories = [] }: { title: string; description?: string; eyebrow: string; basePath: string; query: ReturnType<typeof normalizedListingQuery>; listing: PublicProductListing; breadcrumbs?: Array<{ label: string; href?: string }>; childCategories?: PublicCategory[] }) {
  const activeCount = Number(Boolean(query.minPrice || query.maxPrice)) + Number(query.inStock);
  const pages = Array.from({ length: listing.pagination.pageCount }, (_, index) => index + 1).filter((page) => page === 1 || page === listing.pagination.pageCount || Math.abs(page - query.page) <= 2);
  return <>
    <nav className="sf-breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link>{breadcrumbs.map((item) => <span key={`${item.label}-${item.href ?? "current"}`}>›{item.href ? <Link href={item.href}>{item.label}</Link> : <b>{item.label}</b>}</span>)}</nav>
    <header className="sf-plp-heading"><div><span className="sf-eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div></header>
    {childCategories.length > 0 && <nav className="sf-child-categories" aria-label={`${title} categories`}>{childCategories.map((category) => <Link key={category.id} href={categoryHref(category)}>{category.image ? <img src={category.image.src} alt="" /> : <span aria-hidden="true" />}{category.name}</Link>)}</nav>}
    <div className="sf-plp-mobile-actions"><details><summary>Filters{activeCount ? ` (${activeCount})` : ""}</summary><FilterForm basePath={basePath} query={query} /></details><SortForm basePath={basePath} query={query} compact /></div>
    <div className="sf-plp-layout"><aside className="sf-filter-sidebar"><div className="sf-filter-title"><h2>Filter By</h2>{activeCount > 0 && <Link href={hrefWith(basePath, query, { minPrice: null, maxPrice: null, inStock: null, page: null })}>Clear all</Link>}</div><FilterForm basePath={basePath} query={query} /></aside>
      <section className="sf-plp-results"><div className="sf-plp-toolbar"><strong>{listing.pagination.total} product{listing.pagination.total === 1 ? "" : "s"}</strong><SortForm basePath={basePath} query={query} /></div>
        {activeCount > 0 && <div className="sf-active-filters">{(query.minPrice || query.maxPrice) && <Link href={hrefWith(basePath, query, { minPrice: null, maxPrice: null, page: null })}>${query.minPrice || "0"}–${query.maxPrice || "Any"} ×</Link>}{query.inStock && <Link href={hrefWith(basePath, query, { inStock: null, page: null })}>In stock ×</Link>}<Link className="sf-clear-filters" href={hrefWith(basePath, query, { minPrice: null, maxPrice: null, inStock: null, page: null })}>Clear all</Link></div>}
        {listing.products.length ? <div className="sf-product-grid">{listing.products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="sf-empty">No products match these filters.</p>}
        {listing.pagination.pageCount > 1 && <nav className="sf-pagination" aria-label="Product pages">{query.page > 1 && <Link href={hrefWith(basePath, query, { page: String(query.page - 1) })}>← Previous</Link>}{pages.map((page, index) => <span key={page}>{index > 0 && page - pages[index - 1] > 1 && <i>…</i>}<Link aria-current={page === query.page ? "page" : undefined} href={hrefWith(basePath, query, { page: page === 1 ? null : String(page) })}>{page}</Link></span>)}{query.page < listing.pagination.pageCount && <Link href={hrefWith(basePath, query, { page: String(query.page + 1) })}>Next →</Link>}</nav>}
      </section>
    </div>
  </>;
}

function sharedHidden(query: ReturnType<typeof normalizedListingQuery>) { return <>{query.q && <input type="hidden" name="q" value={query.q} />}{query.sort !== "featured" && <input type="hidden" name="sort" value={query.sort} />}</>; }
function FilterForm({ basePath, query }: { basePath: string; query: ReturnType<typeof normalizedListingQuery> }) { return <form action={basePath} className="sf-filter-form">{sharedHidden(query)}<fieldset><legend>Price</legend><div className="sf-price-inputs"><label><span>Min</span><input name="minPrice" inputMode="decimal" defaultValue={query.minPrice} placeholder="$ 0" /></label><label><span>Max</span><input name="maxPrice" inputMode="decimal" defaultValue={query.maxPrice} placeholder="Any" /></label></div></fieldset><label className="sf-filter-toggle"><span>In Stock Only</span><input type="checkbox" name="inStock" value="true" defaultChecked={query.inStock} /></label><button type="submit">Apply filters</button></form>; }
function SortForm({ basePath, query, compact = false }: { basePath: string; query: ReturnType<typeof normalizedListingQuery>; compact?: boolean }) { return <form action={basePath} className={compact ? "sf-sort-form sf-sort-form--compact" : "sf-sort-form"}>{query.q && <input type="hidden" name="q" value={query.q} />}{query.minPrice && <input type="hidden" name="minPrice" value={query.minPrice} />}{query.maxPrice && <input type="hidden" name="maxPrice" value={query.maxPrice} />}{query.inStock && <input type="hidden" name="inStock" value="true" />}<ListingSort value={query.sort} /></form>; }

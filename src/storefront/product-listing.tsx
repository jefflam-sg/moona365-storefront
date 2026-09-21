import Link from "next/link";
import type { PublicCategory, PublicFilterConfiguration, PublicProductListing } from "./contracts";
import { categoryHref } from "./category-url";
import { ProductCard } from "./catalogue-page";
import { ListingSort } from "./listing-sort";

/* Public catalogue image URLs are validated by the backend response contract. */
/* eslint-disable @next/next/no-img-element */

export type ListingQuery = { page?: string; sort?: string; minPrice?: string; maxPrice?: string; inStock?: string; q?: string };
type Query = ReturnType<typeof normalizedListingQuery>;
type Filters = PublicFilterConfiguration["filterSet"]["items"];
const sorts = new Set(["featured", "newest", "name-asc", "name-desc", "price-asc", "price-desc"]);

export function normalizedListingQuery(query: ListingQuery) {
  const requestedPage = Number(query.page ?? "1");
  const price = (value?: string) => /^\d+(?:\.\d{1,2})?$/.test(value ?? "") ? value! : "";
  return { page: Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100 ? requestedPage : 1, sort: sorts.has(query.sort ?? "") ? query.sort! : "featured", minPrice: price(query.minPrice), maxPrice: price(query.maxPrice), inStock: query.inStock === "true", q: (query.q ?? "").trim().slice(0, 120) };
}

function hrefWith(basePath: string, query: Query, changes: Record<string, string | null>) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.sort !== "featured") params.set("sort", query.sort);
  if (query.minPrice) params.set("minPrice", query.minPrice);
  if (query.maxPrice) params.set("maxPrice", query.maxPrice);
  if (query.inStock) params.set("inStock", "true");
  if (query.page > 1) params.set("page", String(query.page));
  Object.entries(changes).forEach(([key, value]) => value === null ? params.delete(key) : params.set(key, value));
  return basePath + (params.size ? "?" + params : "");
}

export function ProductListingPage({ title, description, eyebrow, basePath, query, listing, filters, breadcrumbs = [], childCategories = [], headingStyle = "banner", headingImage = null }: { title: string; description?: string; eyebrow: string; basePath: string; query: Query; listing: PublicProductListing; filters: Filters; breadcrumbs?: Array<{ label: string; href?: string }>; childCategories?: PublicCategory[]; headingStyle?: "banner" | "plain"; headingImage?: PublicCategory["image"] }) {
  const systemFilters = filters.filter((item) => item.sourceType === "PRICE" || item.sourceType === "IN_STOCK");
  const priceEnabled = filters.some((item) => item.sourceType === "PRICE");
  const stockEnabled = filters.some((item) => item.sourceType === "IN_STOCK");
  const activeCount = Number(priceEnabled && Boolean(query.minPrice || query.maxPrice)) + Number(stockEnabled && query.inStock);
  const pages = Array.from({ length: listing.pagination.pageCount }, (_, index) => index + 1).filter((page) => page === 1 || page === listing.pagination.pageCount || Math.abs(page - query.page) <= 2);
  return <>
    <nav className="sf-breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link>{breadcrumbs.map((item) => <span key={item.label + "-" + (item.href ?? "current")}>›{item.href ? <Link href={item.href}>{item.label}</Link> : <b>{item.label}</b>}</span>)}</nav>
    {systemFilters.length > 0 && <div className="sf-plp-mobile-actions"><details><summary>Filters{activeCount ? " (" + activeCount + ")" : ""}</summary><FilterForm basePath={basePath} query={query} filters={systemFilters} /></details><SortForm basePath={basePath} query={query} compact /></div>}
    <div className="sf-plp-layout" data-no-filters={systemFilters.length === 0}>
      {systemFilters.length > 0 && <aside className="sf-filter-sidebar"><div className="sf-filter-panel"><div className="sf-filter-title"><h2>Filter By</h2>{activeCount > 0 && <Link href={hrefWith(basePath, query, { minPrice: null, maxPrice: null, inStock: null, page: null })}>Clear all</Link>}</div><FilterForm basePath={basePath} query={query} filters={systemFilters} /></div></aside>}
      <div className="sf-plp-main"><header className="sf-plp-heading" data-style={headingStyle}><div>{headingStyle === "banner" && <span className="sf-eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{headingStyle === "banner" && headingImage && <img src={headingImage.src} alt={headingImage.alt} />}</header>
      {childCategories.length > 0 && <nav className="sf-child-categories" aria-label={title + " categories"}>{childCategories.map((category) => <Link key={category.id} href={categoryHref(category)}>{category.image ? <img src={category.image.src} alt="" /> : <span aria-hidden="true" />}{category.name}</Link>)}</nav>}
      <section className="sf-plp-results"><div className="sf-plp-toolbar"><strong>{listing.pagination.total} product{listing.pagination.total === 1 ? "" : "s"}</strong><SortForm basePath={basePath} query={query} /></div>
        {activeCount > 0 && <div className="sf-active-filters">{priceEnabled && (query.minPrice || query.maxPrice) && <Link href={hrefWith(basePath, query, { minPrice: null, maxPrice: null, page: null })}>{"$" + (query.minPrice || "0") + "–$" + (query.maxPrice || "Any") + " ×"}</Link>}{stockEnabled && query.inStock && <Link href={hrefWith(basePath, query, { inStock: null, page: null })}>In stock ×</Link>}<Link className="sf-clear-filters" href={hrefWith(basePath, query, { minPrice: null, maxPrice: null, inStock: null, page: null })}>Clear all</Link></div>}
        {listing.products.length ? <div className="sf-product-grid">{listing.products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="sf-empty">No products match these filters.</p>}
        {listing.pagination.pageCount > 1 && <nav className="sf-pagination" aria-label="Product pages">{query.page > 1 && <Link href={hrefWith(basePath, query, { page: String(query.page - 1) })}>← Previous</Link>}{pages.map((page, index) => <span key={page}>{index > 0 && page - pages[index - 1] > 1 && <i>…</i>}<Link aria-current={page === query.page ? "page" : undefined} href={hrefWith(basePath, query, { page: page === 1 ? null : String(page) })}>{page}</Link></span>)}{query.page < listing.pagination.pageCount && <Link href={hrefWith(basePath, query, { page: String(query.page + 1) })}>Next →</Link>}</nav>}
      </section></div>
    </div>
  </>;
}

function FilterForm({ basePath, query, filters }: { basePath: string; query: Query; filters: Filters }) {
  const price = filters.find((item) => item.sourceType === "PRICE");
  const stock = filters.find((item) => item.sourceType === "IN_STOCK");
  return <form action={basePath} className="sf-filter-form">{query.q && <input type="hidden" name="q" value={query.q} />}{query.sort !== "featured" && <input type="hidden" name="sort" value={query.sort} />}
    {price && <fieldset><legend>{price.customerLabel}</legend><div className="sf-price-inputs"><label><span>Min</span><input name="minPrice" inputMode="decimal" defaultValue={query.minPrice} placeholder="$ 0" /></label><label><span>Max</span><input name="maxPrice" inputMode="decimal" defaultValue={query.maxPrice} placeholder="Any" /></label></div></fieldset>}
    {stock && <label className="sf-filter-toggle"><span>{stock.customerLabel}</span><input type="checkbox" name="inStock" value="true" defaultChecked={query.inStock} /></label>}
    <button type="submit">Apply filters</button>
  </form>;
}

function SortForm({ basePath, query, compact = false }: { basePath: string; query: Query; compact?: boolean }) {
  return <form action={basePath} className={compact ? "sf-sort-form sf-sort-form--compact" : "sf-sort-form"}>{query.q && <input type="hidden" name="q" value={query.q} />}{query.minPrice && <input type="hidden" name="minPrice" value={query.minPrice} />}{query.maxPrice && <input type="hidden" name="maxPrice" value={query.maxPrice} />}{query.inStock && <input type="hidden" name="inStock" value="true" />}<ListingSort value={query.sort} /></form>;
}

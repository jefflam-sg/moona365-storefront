import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadNavigationCatalogue, loadStorefrontProducts } from "@/lib/catalogue";
import { MaintenancePage, ProductCard, StorefrontPageShell } from "@/storefront/catalogue-page";
import { supportsPublishedSnapshot } from "@/storefront/storefront-renderer";
import { categoryForRoute, categoryPathSlug } from "@/storefront/category-url";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ includeSubcategories?: string; page?: string }>;
}) {
  const host = (await headers()).get("host");
  if (!host) notFound();
  const result = await resolvePublishedStorefront(host);
  if (!result) notFound();
  if (!supportsPublishedSnapshot(result.snapshot)) notFound();
  if (result.websiteStatus === "MAINTENANCE") return <MaintenancePage snapshot={result.snapshot} />;
  const [{ slug }, query, catalogue] = await Promise.all([params, searchParams, loadNavigationCatalogue(result.resolvedHost, result.snapshot)]);
  const categories = catalogue?.categories ?? null;
  const category = categories ? categoryForRoute(slug, categories) : undefined;
  if (!category) notFound();
  const includeSubcategories = category.hasChildren && query.includeSubcategories === "true";
  const requestedPage = Number(query.page ?? "1");
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 100 ? requestedPage : 1;
  const canonicalSlug = categoryPathSlug(category.path);
  if (slug.join("/") !== canonicalSlug) {
    const canonicalQuery = new URLSearchParams();
    if (includeSubcategories) canonicalQuery.set("includeSubcategories", "true");
    if (page > 1) canonicalQuery.set("page", String(page));
    redirect(`/categories/${canonicalSlug}${canonicalQuery.size ? `?${canonicalQuery}` : ""}`);
  }
  const products = await loadStorefrontProducts(result.resolvedHost, { source: "category", categoryId: category.id, includeSubcategories, limit: 12, page });
  if (!products) notFound();
  const pageHref = (targetPage: number) => {
    const nextQuery = new URLSearchParams();
    if (includeSubcategories) nextQuery.set("includeSubcategories", "true");
    if (targetPage > 1) nextQuery.set("page", String(targetPage));
    return `/categories/${canonicalSlug}${nextQuery.size ? `?${nextQuery}` : ""}`;
  };
  return <StorefrontPageShell snapshot={result.snapshot} catalogue={catalogue ?? undefined}><header className="sf-page-heading"><span className="sf-eyebrow">CATEGORY</span><h1>{category.name}</h1><p>{category.path}</p></header>{products.length ? <><div className="sf-product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div><nav className="sf-pagination" aria-label={`${category.name} product pages`}>{page > 1 && <Link href={pageHref(page - 1)}>← Previous</Link>}<span>Page {page}</span>{products.length === 12 && page < 100 && <Link href={pageHref(page + 1)}>Next →</Link>}</nav></> : <><p className="sf-empty">{page > 1 ? "There are no more products on this page." : "No products in this category are currently enabled for the Website sales channel."}</p>{page > 1 && <nav className="sf-pagination" aria-label={`${category.name} product pages`}><Link href={pageHref(page - 1)}>← Previous</Link><span>Page {page}</span></nav>}</>}</StorefrontPageShell>;
}

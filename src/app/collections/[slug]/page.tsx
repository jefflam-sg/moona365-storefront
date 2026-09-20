import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadNavigationCatalogue, loadStorefrontProducts } from "@/lib/catalogue";
import { MaintenancePage, ProductCard, StorefrontPageShell } from "@/storefront/catalogue-page";
import { supportsPublishedSnapshot } from "@/storefront/storefront-renderer";
import Link from "next/link";

export const dynamic = "force-dynamic";
export default async function CollectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const host = (await headers()).get("host");
  if (!host) notFound();
  const result = await resolvePublishedStorefront(host);
  if (!result) notFound();
  if (!supportsPublishedSnapshot(result.snapshot)) notFound();
  if (result.websiteStatus === "MAINTENANCE") return <MaintenancePage snapshot={result.snapshot} />;
  const catalogue = await loadNavigationCatalogue(result.resolvedHost, result.snapshot);
  const collections = catalogue?.collections;
  const { slug } = await params;
  const requestedPage = Number((await searchParams).page ?? "1");
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 100 ? requestedPage : 1;
  const collection = collections?.find((entry) => entry.slug === slug);
  if (!collection) notFound();
  const products = await loadStorefrontProducts(result.resolvedHost, { source: "collection", collectionId: collection.id, limit: 12, page });
  if (!products) notFound();
  const pageHref = (targetPage: number) => `/collections/${collection.slug}${targetPage > 1 ? `?page=${targetPage}` : ""}`;
  return <StorefrontPageShell snapshot={result.snapshot} catalogue={catalogue ?? undefined}><header className="sf-page-heading"><span className="sf-eyebrow">COLLECTION</span><h1>{collection.name}</h1>{collection.description && <p>{collection.description}</p>}</header>{products.length ? <><div className="sf-product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div><nav className="sf-pagination" aria-label={`${collection.name} product pages`}>{page > 1 && <Link href={pageHref(page - 1)}>← Previous</Link>}<span>Page {page}</span>{products.length === 12 && page < 100 && <Link href={pageHref(page + 1)}>Next →</Link>}</nav></> : <><p className="sf-empty">{page > 1 ? "There are no more products on this page." : "No available products in this collection."}</p>{page > 1 && <nav className="sf-pagination" aria-label={`${collection.name} product pages`}><Link href={pageHref(page - 1)}>← Previous</Link><span>Page {page}</span></nav>}</>}</StorefrontPageShell>;
}

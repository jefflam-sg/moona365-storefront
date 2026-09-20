import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadNavigationCatalogue, loadStorefrontProducts } from "@/lib/catalogue";
import { MaintenancePage, ProductCard, StorefrontPageShell } from "@/storefront/catalogue-page";
import { supportsPublishedSnapshot } from "@/storefront/storefront-renderer";
import Link from "next/link";

export const dynamic = "force-dynamic";
export default async function ShopPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const host = (await headers()).get("host"); if (!host) notFound();
  const result = await resolvePublishedStorefront(host); if (!result || !supportsPublishedSnapshot(result.snapshot)) notFound();
  if (result.websiteStatus === "MAINTENANCE") return <MaintenancePage snapshot={result.snapshot} />;
  const requestedPage = Number((await searchParams).page ?? "1");
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 100 ? requestedPage : 1;
  const [products, catalogue] = await Promise.all([loadStorefrontProducts(result.resolvedHost, { source: "newest", limit: 12, page }), loadNavigationCatalogue(result.resolvedHost, result.snapshot)]);
  if (!products || !catalogue) notFound();
  return <StorefrontPageShell snapshot={result.snapshot} catalogue={catalogue}><header className="sf-page-heading"><span className="sf-eyebrow">SHOP</span><h1>All products</h1><p>Browse products currently enabled for this website.</p></header>{products.length ? <><div className="sf-product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div><nav className="sf-pagination" aria-label="Product pages">{page > 1 && <Link href={`/shop?page=${page - 1}`}>← Previous</Link>}<span>Page {page}</span>{products.length === 12 && page < 100 && <Link href={`/shop?page=${page + 1}`}>Next →</Link>}</nav></> : <p className="sf-empty">{page > 1 ? "There are no more products on this page." : "No products are currently available."}</p>}</StorefrontPageShell>;
}

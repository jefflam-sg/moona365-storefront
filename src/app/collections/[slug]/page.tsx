import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadNavigationCatalogue, loadStorefrontProducts } from "@/lib/catalogue";
import { MaintenancePage, ProductCard, StorefrontPageShell } from "@/storefront/catalogue-page";
import { supportsPublishedSnapshot } from "@/storefront/storefront-renderer";

export const dynamic = "force-dynamic";
export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const host = (await headers()).get("host");
  if (!host) notFound();
  const result = await resolvePublishedStorefront(host);
  if (!result) notFound();
  if (!supportsPublishedSnapshot(result.snapshot)) notFound();
  if (result.websiteStatus === "MAINTENANCE") return <MaintenancePage snapshot={result.snapshot} />;
  const catalogue = await loadNavigationCatalogue(result.resolvedHost, result.snapshot);
  const collections = catalogue?.collections;
  const { slug } = await params;
  const collection = collections?.find((entry) => entry.slug === slug);
  if (!collection) notFound();
  const products = await loadStorefrontProducts(result.resolvedHost, { source: "collection", collectionId: collection.id, limit: 12 });
  if (!products) notFound();
  return <StorefrontPageShell snapshot={result.snapshot} catalogue={catalogue ?? undefined}><header className="sf-page-heading"><span className="sf-eyebrow">COLLECTION</span><h1>{collection.name}</h1>{collection.description && <p>{collection.description}</p>}</header>{products.length ? <div className="sf-product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="sf-empty">No available products in this collection.</p>}</StorefrontPageShell>;
}

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadNavigationCatalogue, loadStorefrontProducts } from "@/lib/catalogue";
import { MaintenancePage, ProductDetail, StorefrontPageShell } from "@/storefront/catalogue-page";
import { supportsPublishedSnapshot } from "@/storefront/storefront-renderer";

export const dynamic = "force-dynamic";
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const host = (await headers()).get("host");
  if (!host) notFound();
  const result = await resolvePublishedStorefront(host);
  if (!result) notFound();
  if (!supportsPublishedSnapshot(result.snapshot)) notFound();
  if (result.websiteStatus === "MAINTENANCE") return <MaintenancePage snapshot={result.snapshot} />;
  const id = (await params).id;
  const [products, catalogue] = await Promise.all([loadStorefrontProducts(result.resolvedHost, { source: "manual", productIds: [id], limit: 1 }), loadNavigationCatalogue(result.resolvedHost, result.snapshot)]);
  const product = products?.find((entry) => entry.id === id);
  if (!product) notFound();
  let related = await loadStorefrontProducts(result.resolvedHost, product.collectionIds[0] ? { source: "collection", collectionId: product.collectionIds[0], limit: 8 } : { source: "newest", limit: 8 });
  let recommendations = (related ?? []).filter((entry) => entry.id !== product.id).slice(0, 5);
  if (product.collectionIds[0] && recommendations.length === 0) {
    related = await loadStorefrontProducts(result.resolvedHost, { source: "newest", limit: 8 });
    recommendations = (related ?? []).filter((entry) => entry.id !== product.id).slice(0, 5);
  }
  const brandValues = result.snapshot.homepage.sections.find((section) => section.visible && section.type === "product-page-brand-values")
    ?? result.snapshot.homepage.sections.find((section) => section.visible && section.type === "services" && section.layout === "compact")
    ?? result.snapshot.homepage.sections.find((section) => section.visible && section.type === "services");
  return <StorefrontPageShell snapshot={result.snapshot} catalogue={catalogue ?? undefined}><ProductDetail product={product} recommendations={recommendations} brandValues={brandValues} /></StorefrontPageShell>;
}

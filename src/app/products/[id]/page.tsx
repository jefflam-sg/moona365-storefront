import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadNavigationCatalogue, loadStorefrontProducts } from "@/lib/catalogue";
import { CatalogueUnavailablePage, MaintenancePage, ProductDetail, StorefrontPageShell } from "@/storefront/catalogue-page";
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
  const isInternalId = /^[0-9A-HJKMNP-TV-Z]{26}$/.test(id);
  const [products, catalogue] = await Promise.all([loadStorefrontProducts(result.resolvedHost, { source: "manual", ...(isInternalId ? { productIds: [id] } : { productSlug: id }), limit: 1 }), loadNavigationCatalogue(result.resolvedHost, result.snapshot)]);
  if (products === null) return <CatalogueUnavailablePage snapshot={result.snapshot} />;
  const product = products.find((entry) => entry.id === id || entry.slug === id);
  if (!product) notFound();
  if (isInternalId) redirect(`/products/${product.slug}`);
  let related = await loadStorefrontProducts(result.resolvedHost, product.collectionIds[0] ? { source: "collection", collectionId: product.collectionIds[0], limit: 8 } : { source: "newest", limit: 8 });
  let recommendations = (related ?? []).filter((entry) => entry.id !== product.id).slice(0, 5);
  if (product.collectionIds[0] && recommendations.length === 0) {
    related = await loadStorefrontProducts(result.resolvedHost, { source: "newest", limit: 8 });
    recommendations = (related ?? []).filter((entry) => entry.id !== product.id).slice(0, 5);
  }
  const configuredSections = result.snapshot.pages?.product.sections.filter((section) => section.visible) ?? [];
  const legacyBrandValues = result.snapshot.homepage.sections.find((section) => section.visible && section.type === "product-page-brand-values");
  const productSections = configuredSections.length ? configuredSections : legacyBrandValues ? [{ ...legacyBrandValues, type: "brand-values" as const }] : [];
  return <StorefrontPageShell snapshot={result.snapshot} catalogue={catalogue ?? undefined}><ProductDetail product={product} recommendations={recommendations} bottomSections={productSections} catalogue={catalogue ?? undefined} /></StorefrontPageShell>;
}

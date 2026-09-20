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
  return <StorefrontPageShell snapshot={result.snapshot} catalogue={catalogue ?? undefined}><ProductDetail product={product} /></StorefrontPageShell>;
}

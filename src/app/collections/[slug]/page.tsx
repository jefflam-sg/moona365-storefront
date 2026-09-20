import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadNavigationCatalogue, loadStorefrontFilterConfiguration, loadStorefrontListing } from "@/lib/catalogue";
import { MaintenancePage, StorefrontPageShell } from "@/storefront/catalogue-page";
import { normalizedListingQuery, ProductListingPage, type ListingQuery } from "@/storefront/product-listing";
import { supportsPublishedSnapshot } from "@/storefront/storefront-renderer";

export const dynamic = "force-dynamic";
export default async function CollectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<ListingQuery> }) {
  const host = (await headers()).get("host"); if (!host) notFound();
  const result = await resolvePublishedStorefront(host); if (!result || !supportsPublishedSnapshot(result.snapshot)) notFound();
  if (result.websiteStatus === "MAINTENANCE") return <MaintenancePage snapshot={result.snapshot} />;
  const [{ slug }, rawQuery, catalogue] = await Promise.all([params, searchParams, loadNavigationCatalogue(result.resolvedHost, result.snapshot)]);
  const collection = catalogue?.collections.find((entry) => entry.slug === slug); if (!collection || !catalogue) notFound();
  const query = normalizedListingQuery(rawQuery);
  const [listing, filters] = await Promise.all([loadStorefrontListing(result.resolvedHost, { source: "collection", collectionId: collection.id, limit: 12, ...query }), loadStorefrontFilterConfiguration(result.resolvedHost, { scopeType: "COLLECTION", scopeId: collection.id })]); if (!listing || !filters) notFound();
  return <StorefrontPageShell snapshot={result.snapshot} catalogue={catalogue}><ProductListingPage title={collection.name} description={collection.description} eyebrow="COLLECTION" basePath={`/collections/${collection.slug}`} query={query} listing={listing} filters={filters.filterSet.items} breadcrumbs={[{ label: "Collections", href: "/collections" }, { label: collection.name }]} /></StorefrontPageShell>;
}

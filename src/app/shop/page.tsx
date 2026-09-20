import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadNavigationCatalogue, loadStorefrontFilterConfiguration, loadStorefrontListing } from "@/lib/catalogue";
import { MaintenancePage, StorefrontPageShell } from "@/storefront/catalogue-page";
import { normalizedListingQuery, ProductListingPage, type ListingQuery } from "@/storefront/product-listing";
import { supportsPublishedSnapshot } from "@/storefront/storefront-renderer";

export const dynamic = "force-dynamic";
export default async function ShopPage({ searchParams }: { searchParams: Promise<ListingQuery> }) {
  const host = (await headers()).get("host"); if (!host) notFound();
  const result = await resolvePublishedStorefront(host); if (!result || !supportsPublishedSnapshot(result.snapshot)) notFound();
  if (result.websiteStatus === "MAINTENANCE") return <MaintenancePage snapshot={result.snapshot} />;
  const query = normalizedListingQuery(await searchParams);
  const [listing, catalogue, filters] = await Promise.all([loadStorefrontListing(result.resolvedHost, { source: "newest", limit: 12, ...query }), loadNavigationCatalogue(result.resolvedHost, result.snapshot), loadStorefrontFilterConfiguration(result.resolvedHost)]);
  if (!listing || !catalogue || !filters) notFound();
  return <StorefrontPageShell snapshot={result.snapshot} catalogue={catalogue}><ProductListingPage title="All products" description="Browse products currently available from our online store." eyebrow="SHOP" basePath="/shop" query={query} listing={listing} filters={filters.filterSet.items} breadcrumbs={[{ label: "Shop" }]} /></StorefrontPageShell>;
}

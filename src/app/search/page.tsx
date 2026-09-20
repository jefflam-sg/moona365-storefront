import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadNavigationCatalogue, loadStorefrontListing } from "@/lib/catalogue";
import { MaintenancePage, StorefrontPageShell } from "@/storefront/catalogue-page";
import { normalizedListingQuery, ProductListingPage, type ListingQuery } from "@/storefront/product-listing";
import { supportsPublishedSnapshot } from "@/storefront/storefront-renderer";

export const dynamic = "force-dynamic";
export default async function SearchPage({ searchParams }: { searchParams: Promise<ListingQuery> }) {
  const host = (await headers()).get("host"); if (!host) notFound();
  const result = await resolvePublishedStorefront(host); if (!result || !supportsPublishedSnapshot(result.snapshot)) notFound();
  if (result.websiteStatus === "MAINTENANCE") return <MaintenancePage snapshot={result.snapshot} />;
  const query = normalizedListingQuery(await searchParams);
  if (!query.q) return <StorefrontPageShell snapshot={result.snapshot}><header className="sf-page-heading"><h1>Search products</h1><p>Enter a product name in the website search.</p></header></StorefrontPageShell>;
  const [listing, catalogue] = await Promise.all([loadStorefrontListing(result.resolvedHost, { source: "search", search: query.q, limit: 12, ...query }), loadNavigationCatalogue(result.resolvedHost, result.snapshot)]);
  if (!listing || !catalogue) notFound();
  return <StorefrontPageShell snapshot={result.snapshot} catalogue={catalogue}><ProductListingPage title={`Results for “${query.q}”`} eyebrow="SEARCH" basePath="/search" query={query} listing={listing} breadcrumbs={[{ label: "Search" }]} /></StorefrontPageShell>;
}

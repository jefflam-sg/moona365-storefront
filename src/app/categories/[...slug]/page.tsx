import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadNavigationCatalogue, loadStorefrontFilterConfiguration, loadStorefrontListing } from "@/lib/catalogue";
import { MaintenancePage, StorefrontPageShell } from "@/storefront/catalogue-page";
import { categoryForRoute, categoryPathSlug } from "@/storefront/category-url";
import { normalizedListingQuery, ProductListingPage, type ListingQuery } from "@/storefront/product-listing";
import { supportsPublishedSnapshot } from "@/storefront/storefront-renderer";

export const dynamic = "force-dynamic";
const slugPart = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string[] }>; searchParams: Promise<ListingQuery> }) {
  const host = (await headers()).get("host"); if (!host) notFound();
  const result = await resolvePublishedStorefront(host); if (!result || !supportsPublishedSnapshot(result.snapshot)) notFound();
  if (result.websiteStatus === "MAINTENANCE") return <MaintenancePage snapshot={result.snapshot} />;
  const [{ slug }, rawQuery, catalogue] = await Promise.all([params, searchParams, loadNavigationCatalogue(result.resolvedHost, result.snapshot)]);
  const category = catalogue ? categoryForRoute(slug, catalogue.categories) : undefined; if (!category || !catalogue) notFound();
  const canonicalSlug = categoryPathSlug(category.path); const query = normalizedListingQuery(rawQuery);
  if (slug.join("/") !== canonicalSlug) redirect(`/categories/${canonicalSlug}`);
  const [listing, filters] = await Promise.all([loadStorefrontListing(result.resolvedHost, { source: "category", categoryId: category.id, includeSubcategories: category.hasChildren, limit: 12, ...query }), loadStorefrontFilterConfiguration(result.resolvedHost, { scopeType: "CATEGORY", scopeId: category.id })]); if (!listing || !filters) notFound();
  const pathParts = category.path.split(" > ");
  const breadcrumbs = pathParts.map((label, index) => ({ label, href: index === pathParts.length - 1 ? undefined : `/categories/${pathParts.slice(0, index + 1).map(slugPart).join("/")}` }));
  const children = catalogue.categories.filter((item) => item.parentId === category.id);
  return <StorefrontPageShell snapshot={result.snapshot} catalogue={catalogue}><ProductListingPage title={category.name} eyebrow="CATEGORY" basePath={`/categories/${canonicalSlug}`} query={query} listing={listing} filters={filters.filterSet.items} breadcrumbs={breadcrumbs} childCategories={children} headingStyle={category.hasChildren ? "banner" : "plain"} headingImage={category.hasChildren ? category.image : null} /></StorefrontPageShell>;
}

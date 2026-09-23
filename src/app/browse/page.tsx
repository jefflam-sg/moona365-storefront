import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadNavigationCatalogue } from "@/lib/catalogue";
import { CategoryCard, CollectionCard, MaintenancePage, StorefrontPageShell } from "@/storefront/catalogue-page";
import { supportsPublishedSnapshot } from "@/storefront/storefront-renderer";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const host = (await headers()).get("host");
  if (!host) notFound();
  const result = await resolvePublishedStorefront(host);
  if (!result) notFound();
  if (!supportsPublishedSnapshot(result.snapshot)) notFound();
  if (result.websiteStatus === "MAINTENANCE") return <MaintenancePage snapshot={result.snapshot} />;
  const catalogue = await loadNavigationCatalogue(result.resolvedHost, result.snapshot);
  if (!catalogue) notFound();
  const categories = catalogue.categories.filter((category) => category.parentId === null);

  return <StorefrontPageShell snapshot={result.snapshot} catalogue={catalogue}>
    <header className="sf-page-heading"><span className="sf-eyebrow">SHOP</span><h1>Browse our shop</h1><p>Explore product categories and curated collections.</p></header>
    <section className="sf-browse-section" aria-labelledby="browse-categories"><h2 id="browse-categories">Product categories</h2><div className="sf-category-grid">{categories.map((category) => <CategoryCard key={category.id} category={category} />)}</div></section>
    <section className="sf-browse-section" aria-labelledby="browse-collections"><h2 id="browse-collections">Curated collections</h2><div className="sf-category-grid">{catalogue.collections.map((collection) => <CollectionCard key={collection.id} collection={collection} />)}</div></section>
  </StorefrontPageShell>;
}

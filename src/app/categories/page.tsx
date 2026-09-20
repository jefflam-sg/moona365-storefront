import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadStorefrontCategories } from "@/lib/catalogue";
import { CategoryCard, MaintenancePage, StorefrontPageShell } from "@/storefront/catalogue-page";
import { supportsPublishedSnapshot } from "@/storefront/storefront-renderer";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const host = (await headers()).get("host");
  if (!host) notFound();
  const result = await resolvePublishedStorefront(host);
  if (!result) notFound();
  if (!supportsPublishedSnapshot(result.snapshot)) notFound();
  if (result.websiteStatus === "MAINTENANCE") return <MaintenancePage snapshot={result.snapshot} />;
  const categories = await loadStorefrontCategories(result.resolvedHost);
  if (!categories) notFound();
  const roots = categories.filter((category) => category.parentId === null);
  return <StorefrontPageShell snapshot={result.snapshot}><header className="sf-page-heading"><span className="sf-eyebrow">SHOP</span><h1>Product categories</h1><p>Browse products by category.</p></header><div className="sf-category-grid">{roots.map((category) => <CategoryCard key={category.id} category={category} />)}</div></StorefrontPageShell>;
}

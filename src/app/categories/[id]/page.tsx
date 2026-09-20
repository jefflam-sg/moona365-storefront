import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadStorefrontCategories, loadStorefrontProducts } from "@/lib/catalogue";
import { MaintenancePage, ProductCard, StorefrontPageShell } from "@/storefront/catalogue-page";
import { supportsPublishedSnapshot } from "@/storefront/storefront-renderer";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ includeSubcategories?: string }>;
}) {
  const host = (await headers()).get("host");
  if (!host) notFound();
  const result = await resolvePublishedStorefront(host);
  if (!result) notFound();
  if (!supportsPublishedSnapshot(result.snapshot)) notFound();
  if (result.websiteStatus === "MAINTENANCE") return <MaintenancePage snapshot={result.snapshot} />;
  const [{ id }, query, categories] = await Promise.all([params, searchParams, loadStorefrontCategories(result.resolvedHost)]);
  const category = categories?.find((entry) => entry.id === id);
  if (!category) notFound();
  const includeSubcategories = category.hasChildren && query.includeSubcategories === "true";
  const products = await loadStorefrontProducts(result.resolvedHost, { source: "category", categoryId: category.id, includeSubcategories, limit: 12 });
  if (!products) notFound();
  return <StorefrontPageShell snapshot={result.snapshot}><header className="sf-page-heading"><span className="sf-eyebrow">CATEGORY</span><h1>{category.name}</h1><p>{category.path}</p></header>{products.length ? <div className="sf-product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="sf-empty">No available products in this category.</p>}</StorefrontPageShell>;
}

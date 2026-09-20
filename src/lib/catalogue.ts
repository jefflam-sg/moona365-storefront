import { loadHomepageCatalogue as load, loadPublicCategories as loadCategories, loadPublicCollections as loadCollections, loadPublicProducts as loadProducts } from "./catalogue-core.mjs";
import type { HomepageCatalogue, PublicCategory, PublicCollection, PublicProduct, StorefrontSnapshot } from "@/storefront/contracts";

export async function loadHomepageCatalogue(host: string, snapshot: StorefrontSnapshot): Promise<HomepageCatalogue | null> {
  return (await load(host, snapshot)) as HomepageCatalogue | null;
}

export async function loadStorefrontCollections(host: string): Promise<PublicCollection[] | null> {
  const result = await loadCollections(host);
  return result ? result.collections as PublicCollection[] : null;
}
export async function loadStorefrontCategories(host: string): Promise<PublicCategory[] | null> {
  const result = await loadCategories(host);
  return result ? result.categories as PublicCategory[] : null;
}

export async function loadStorefrontProducts(host: string, query: { source: "newest" | "collection" | "manual" | "category"; collectionId?: string; categoryId?: string; includeSubcategories?: boolean; productIds?: string[]; limit?: number }): Promise<PublicProduct[] | null> {
  const result = await loadProducts(host, query);
  return result ? result.products as PublicProduct[] : null;
}

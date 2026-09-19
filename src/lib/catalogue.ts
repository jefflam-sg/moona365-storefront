import { loadHomepageCatalogue as load, loadPublicCollections as loadCollections, loadPublicProducts as loadProducts } from "./catalogue-core.mjs";
import type { HomepageCatalogue, PublicCollection, PublicProduct, StorefrontSnapshot } from "@/storefront/contracts";

export async function loadHomepageCatalogue(host: string, snapshot: StorefrontSnapshot): Promise<HomepageCatalogue | null> {
  return (await load(host, snapshot)) as HomepageCatalogue | null;
}

export async function loadStorefrontCollections(host: string): Promise<PublicCollection[] | null> {
  const result = await loadCollections(host);
  return result ? result.collections as PublicCollection[] : null;
}

export async function loadStorefrontProducts(host: string, query: { source: "newest" | "collection" | "manual"; collectionId?: string; productIds?: string[]; limit?: number }): Promise<PublicProduct[] | null> {
  const result = await loadProducts(host, query);
  return result ? result.products as PublicProduct[] : null;
}

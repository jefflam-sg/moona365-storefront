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
export async function loadNavigationCatalogue(host: string, snapshot?: StorefrontSnapshot): Promise<HomepageCatalogue | null> {
  const [categories, collections] = await Promise.all([loadStorefrontCategories(host), loadStorefrontCollections(host)]);
  if (!categories || !collections) return null;
  const productIds = [...new Set(Object.values(snapshot?.navigation?.menus ?? {}).flatMap((menu) => menu.nodes.flatMap((node) => [node.destination, node.megaMenu?.promo?.destination].flatMap((destination) => destination?.type === "PRODUCT" ? [destination.productId] : []))))];
  const products: PublicProduct[] = [];
  for (let index = 0; index < productIds.length; index += 12) {
    const page = await loadStorefrontProducts(host, { source: "manual", productIds: productIds.slice(index, index + 12), limit: 12 });
    if (!page) return null;
    products.push(...page);
  }
  return { categories, collections, productsBySectionId: products.length ? { __navigation: products } : {} };
}

export async function loadStorefrontProducts(host: string, query: { source: "newest" | "collection" | "manual" | "category"; collectionId?: string; categoryId?: string; includeSubcategories?: boolean; productIds?: string[]; limit?: number; page?: number }): Promise<PublicProduct[] | null> {
  const result = await loadProducts(host, query);
  return result ? result.products as PublicProduct[] : null;
}

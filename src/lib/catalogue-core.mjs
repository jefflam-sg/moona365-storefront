const record = (value) => !!value && typeof value === "object" && !Array.isArray(value);
const exact = (value, keys) =>
  record(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const text = (value) => typeof value === "string";
const safeImageSource = (value) => {
  if (!text(value) || value.length > 2000) return false;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};
const validImage = (value) => value === null || (exact(value, ["src", "alt"]) && safeImageSource(value.src) && text(value.alt) && value.alt.length <= 120);
const validVariantImage = (value) => value === null || (exact(value, ["mediaAssetId", "src", "alt"]) && text(value.mediaAssetId) && safeImageSource(value.src) && text(value.alt) && value.alt.length <= 120);

export function isCollectionsResponse(value, host) {
  return exact(value, ["apiVersion", "resolvedHost", "siteId", "calculatedAt", "collections"]) &&
    value.apiVersion === 1 && value.resolvedHost === host && text(value.siteId) && text(value.calculatedAt) &&
    Array.isArray(value.collections) && value.collections.every((collection) =>
      exact(collection, ["id", "name", "slug", "path", "description", "image"]) &&
      [collection.id, collection.name, collection.slug, collection.path, collection.description].every(text) && validImage(collection.image));
}

export function isCategoriesResponse(value, host) {
  return exact(value, ["apiVersion", "resolvedHost", "siteId", "calculatedAt", "categories"]) &&
    value.apiVersion === 1 && value.resolvedHost === host && text(value.siteId) && text(value.calculatedAt) &&
    Array.isArray(value.categories) && value.categories.every((category) =>
      exact(category, ["id", "name", "parentId", "path", "image", "hasChildren"]) &&
      [category.id, category.name, category.path].every(text) &&
      (category.parentId === null || text(category.parentId)) && validImage(category.image) &&
      typeof category.hasChildren === "boolean");
}

export function isProductsResponse(value, host) {
  return exact(value, ["apiVersion", "resolvedHost", "siteId", "calculatedAt", "products"]) &&
    value.apiVersion === 1 && value.resolvedHost === host && text(value.siteId) && text(value.calculatedAt) &&
    Array.isArray(value.products) && value.products.every((product) =>
      exact(product, ["id", "slug", "name", "shortDescription", "primaryImage", "collectionIds", "variants"]) &&
      [product.id, product.slug, product.name, product.shortDescription].every(text) && validImage(product.primaryImage) &&
      Array.isArray(product.collectionIds) && product.collectionIds.every(text) && Array.isArray(product.variants) &&
      product.variants.every((variant) => exact(variant, ["id", "label", "primaryImage", "price", "availability", "purchasable"]) &&
        text(variant.id) && text(variant.label) && validVariantImage(variant.primaryImage) && exact(variant.price, ["amount", "currency"]) &&
        text(variant.price.amount) && text(variant.price.currency) &&
        ["AVAILABLE", "SOLD_OUT", "UNAVAILABLE"].includes(variant.availability) && typeof variant.purchasable === "boolean"));
}

async function getJson(url, host, validator, fetchImpl) {
  const response = await fetchImpl(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const value = await response.json();
  return validator(value, host) ? value : null;
}

export async function loadPublicCollections(host, options = {}) {
  const baseUrl = options.baseUrl ?? process.env.MOONA365_API_URL;
  if (!baseUrl) throw new Error("MOONA365_API_URL is required");
  const fetchImpl = options.fetchImpl ?? fetch;
  const root = baseUrl.replace(/\/$/, "");
  return getJson(`${root}/public/storefront/v1/collections?host=${encodeURIComponent(host)}`, host, isCollectionsResponse, fetchImpl);
}

export async function loadPublicCategories(host, options = {}) {
  const baseUrl = options.baseUrl ?? process.env.MOONA365_API_URL;
  if (!baseUrl) throw new Error("MOONA365_API_URL is required");
  const fetchImpl = options.fetchImpl ?? fetch;
  const root = baseUrl.replace(/\/$/, "");
  return getJson(`${root}/public/storefront/v1/categories?host=${encodeURIComponent(host)}`, host, isCategoriesResponse, fetchImpl);
}

export async function loadPublicProducts(host, query, options = {}) {
  const baseUrl = options.baseUrl ?? process.env.MOONA365_API_URL;
  if (!baseUrl) throw new Error("MOONA365_API_URL is required");
  const fetchImpl = options.fetchImpl ?? fetch;
  const root = baseUrl.replace(/\/$/, "");
  const params = new URLSearchParams({ host, source: query.source, limit: String(query.limit ?? 12) });
  if (query.page) params.set("page", String(query.page));
  if (query.collectionId) params.set("collectionId", query.collectionId);
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.source === "category") params.set("includeSubcategories", String(Boolean(query.includeSubcategories)));
  for (const id of query.productIds ?? []) params.append("productId", id);
  return getJson(`${root}/public/storefront/v1/products?${params}`, host, isProductsResponse, fetchImpl);
}

export async function loadHomepageCatalogue(host, snapshot, options = {}) {
  const baseUrl = options.baseUrl ?? process.env.MOONA365_API_URL;
  if (!baseUrl) throw new Error("MOONA365_API_URL is required");
  const fetchImpl = options.fetchImpl ?? fetch;
  const visible = snapshot.homepage.sections.filter((section) => section.visible);
  const navigationNodes = Object.values(snapshot.navigation?.menus ?? {}).flatMap((menu) => menu?.nodes ?? []);
  const needsCategories = visible.some((section) => ["categories", "category-cards"].includes(section.type)) || navigationNodes.some((node) => node.destination?.type === "PRODUCT_CATEGORY" || node.automaticChildren);
  const needsCollections = navigationNodes.some((node) => node.destination?.type === "WEBSITE_COLLECTION" || node.megaMenu?.promo?.destination?.type === "WEBSITE_COLLECTION");
  const productSections = visible.filter((section) => section.type === "product-showcase" && ["newest", "collection", "manual"].includes(section.source.kind));
  const root = baseUrl.replace(/\/$/, "");
  const [categories, collections] = await Promise.all([
    needsCategories ? getJson(`${root}/public/storefront/v1/categories?host=${encodeURIComponent(host)}`, host, isCategoriesResponse, fetchImpl) : Promise.resolve({ categories: [] }),
    needsCollections ? getJson(`${root}/public/storefront/v1/collections?host=${encodeURIComponent(host)}`, host, isCollectionsResponse, fetchImpl) : Promise.resolve({ collections: [] }),
  ]);
  if (!categories || !collections) return null;
  const entries = await Promise.all(productSections.map(async (section) => {
    const tabs = section.tabs ?? [];
    const requests = [];
    if (!tabs.length || tabs.some((tab) => !tab.collectionId)) {
      requests.push({ source: section.source.kind, collectionId: section.source.collectionId, productIds: section.source.productIds, limit: section.limit });
    }
    for (const collectionId of new Set(tabs.map((tab) => tab.collectionId).filter(Boolean))) {
      requests.push({ source: "collection", collectionId, productIds: [], limit: section.limit });
    }
    const results = await Promise.all(requests.map(async (request) => {
      const params = new URLSearchParams({ host, source: request.source, limit: String(request.limit) });
      if (request.source === "collection") params.set("collectionId", request.collectionId);
      if (request.source === "manual") request.productIds.forEach((id) => params.append("productId", id));
      return getJson(`${root}/public/storefront/v1/products?${params}`, host, isProductsResponse, fetchImpl);
    }));
    if (results.some((result) => result === null)) return null;
    const products = [];
    const seen = new Set();
    for (const result of results) {
      for (const product of result.products) {
        if (!seen.has(product.id)) {
          seen.add(product.id);
          products.push(product);
        }
      }
    }
    return [section.id, products];
  }));
  if (entries.some((entry) => entry === null)) return null;
  const navigationProductIds = [...new Set(Object.values(snapshot.navigation?.menus ?? {}).flatMap((menu) => (menu?.nodes ?? []).flatMap((node) => {
    const ids = [];
    if (node.destination?.type === "PRODUCT") ids.push(node.destination.productId);
    if (node.megaMenu?.promo?.destination?.type === "PRODUCT") ids.push(node.megaMenu.promo.destination.productId);
    return ids;
  })).filter(Boolean))];
  if (navigationProductIds.length) {
    const products = [];
    for (let index = 0; index < navigationProductIds.length; index += 12) {
      const params = new URLSearchParams({ host, source: "manual", limit: "12" });
      navigationProductIds.slice(index, index + 12).forEach((id) => params.append("productId", id));
      const result = await getJson(`${root}/public/storefront/v1/products?${params}`, host, isProductsResponse, fetchImpl);
      if (!result) return null;
      products.push(...result.products);
    }
    entries.push(["__navigation", products]);
  }
  return { categories: categories.categories, collections: collections.collections, productsBySectionId: Object.fromEntries(entries) };
}

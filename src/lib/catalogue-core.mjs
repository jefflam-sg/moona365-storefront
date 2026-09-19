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

export function isCollectionsResponse(value, host) {
  return exact(value, ["apiVersion", "resolvedHost", "siteId", "calculatedAt", "collections"]) &&
    value.apiVersion === 1 && value.resolvedHost === host && text(value.siteId) && text(value.calculatedAt) &&
    Array.isArray(value.collections) && value.collections.every((collection) =>
      exact(collection, ["id", "name", "slug", "path", "description", "image"]) &&
      [collection.id, collection.name, collection.slug, collection.path, collection.description].every(text) && validImage(collection.image));
}

export function isProductsResponse(value, host) {
  return exact(value, ["apiVersion", "resolvedHost", "siteId", "calculatedAt", "products"]) &&
    value.apiVersion === 1 && value.resolvedHost === host && text(value.siteId) && text(value.calculatedAt) &&
    Array.isArray(value.products) && value.products.every((product) =>
      exact(product, ["id", "slug", "name", "shortDescription", "primaryImage", "collectionIds", "variants"]) &&
      [product.id, product.slug, product.name, product.shortDescription].every(text) && validImage(product.primaryImage) &&
      Array.isArray(product.collectionIds) && product.collectionIds.every(text) && Array.isArray(product.variants) &&
      product.variants.every((variant) => exact(variant, ["id", "label", "price", "availability", "purchasable"]) &&
        text(variant.id) && text(variant.label) && exact(variant.price, ["amount", "currency"]) &&
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

export async function loadPublicProducts(host, query, options = {}) {
  const baseUrl = options.baseUrl ?? process.env.MOONA365_API_URL;
  if (!baseUrl) throw new Error("MOONA365_API_URL is required");
  const fetchImpl = options.fetchImpl ?? fetch;
  const root = baseUrl.replace(/\/$/, "");
  const params = new URLSearchParams({ host, source: query.source, limit: String(query.limit ?? 12) });
  if (query.collectionId) params.set("collectionId", query.collectionId);
  for (const id of query.productIds ?? []) params.append("productId", id);
  return getJson(`${root}/public/storefront/v1/products?${params}`, host, isProductsResponse, fetchImpl);
}

export async function loadHomepageCatalogue(host, snapshot, options = {}) {
  const baseUrl = options.baseUrl ?? process.env.MOONA365_API_URL;
  if (!baseUrl) throw new Error("MOONA365_API_URL is required");
  const fetchImpl = options.fetchImpl ?? fetch;
  const visible = snapshot.homepage.sections.filter((section) => section.visible);
  const needsCollections = visible.some((section) => section.type === "categories");
  const productSections = visible.filter((section) => section.type === "product-showcase" && ["newest", "collection", "manual"].includes(section.source.kind));
  const root = baseUrl.replace(/\/$/, "");
  const collections = needsCollections
    ? await getJson(`${root}/public/storefront/v1/collections?host=${encodeURIComponent(host)}`, host, isCollectionsResponse, fetchImpl)
    : { collections: [] };
  if (!collections) return null;
  const entries = await Promise.all(productSections.map(async (section) => {
    const fetchLimit = section.tabs?.length ? 12 : section.limit;
    const params = new URLSearchParams({ host, source: section.source.kind, limit: String(fetchLimit) });
    if (section.source.kind === "collection") params.set("collectionId", section.source.collectionId);
    if (section.source.kind === "manual") section.source.productIds.forEach((id) => params.append("productId", id));
    const result = await getJson(`${root}/public/storefront/v1/products?${params}`, host, isProductsResponse, fetchImpl);
    return result ? [section.id, result.products] : null;
  }));
  if (entries.some((entry) => entry === null)) return null;
  return { collections: collections.collections, productsBySectionId: Object.fromEntries(entries) };
}

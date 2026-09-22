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
const validVariant = (variant) => {
  const legacyKeys = ["id", "label", "price", "availability", "purchasable"];
  const imageKeys = ["id", "label", "primaryImage", "price", "availability", "purchasable"];
  const commerceKeys = [...imageKeys, "compareAtPrice"];
  return (exact(variant, legacyKeys) || exact(variant, imageKeys) || exact(variant, commerceKeys)) &&
    text(variant.id) && text(variant.label) &&
    (!Object.hasOwn(variant, "primaryImage") || validVariantImage(variant.primaryImage)) &&
    exact(variant.price, ["amount", "currency"]) && text(variant.price.amount) && text(variant.price.currency) &&
    (!Object.hasOwn(variant, "compareAtPrice") || variant.compareAtPrice === null ||
      (exact(variant.compareAtPrice, ["amount", "currency"]) && text(variant.compareAtPrice.amount) && text(variant.compareAtPrice.currency))) &&
    ["AVAILABLE", "SOLD_OUT", "UNAVAILABLE"].includes(variant.availability) && typeof variant.purchasable === "boolean";
};

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
  const keys = ["apiVersion", "resolvedHost", "siteId", "calculatedAt", "products", "pagination"];
  const hasFacets = exact(value, [...keys, "facets"]);
  return (exact(value, keys) || hasFacets) &&
    value.apiVersion === 1 && value.resolvedHost === host && text(value.siteId) && text(value.calculatedAt) &&
    exact(value.pagination, ["page", "pageSize", "total", "pageCount"]) &&
    [value.pagination.page, value.pagination.pageSize, value.pagination.total, value.pagination.pageCount].every((item) => Number.isSafeInteger(item) && item >= 0) &&
    Array.isArray(value.products) && value.products.every((product) =>
      (exact(product, ["id", "slug", "name", "shortDescription", "primaryImage", "collectionIds", "variants"]) ||
       exact(product, ["id", "slug", "name", "shortDescription", "variantOptionName", "isNew", "primaryImage", "collectionIds", "variants"])) &&
      [product.id, product.slug, product.name, product.shortDescription].every(text) && validImage(product.primaryImage) &&
      (!Object.hasOwn(product, "variantOptionName") || product.variantOptionName === null || text(product.variantOptionName)) &&
      (!Object.hasOwn(product, "isNew") || typeof product.isNew === "boolean") &&
      Array.isArray(product.collectionIds) && product.collectionIds.every(text) && Array.isArray(product.variants) &&
      product.variants.every(validVariant)) &&
    (!hasFacets || (Array.isArray(value.facets) && value.facets.every((facet) =>
      exact(facet, ["key", "values"]) && text(facet.key) && Array.isArray(facet.values) &&
      facet.values.every((entry) => exact(entry, ["value", "label", "count"]) &&
        text(entry.value) && text(entry.label) && Number.isSafeInteger(entry.count) && entry.count >= 0))));
}

export function isFilterConfigurationResponse(value, host) {
  const item = (entry) => exact(entry, ["key", "sourceType", "customerLabel", "presentation", "multipleSelection", "showProductCount", "maxInitiallyVisible", "valueSort"]) &&
    [entry.key, entry.sourceType, entry.customerLabel, entry.presentation, entry.valueSort].every(text) &&
    typeof entry.multipleSelection === "boolean" && typeof entry.showProductCount === "boolean" &&
    Number.isSafeInteger(entry.maxInitiallyVisible) && entry.maxInitiallyVisible >= 1;
  const legacyKeys = ["id", "name", "scopeType", "scopeId", "items"];
  const provenanceKeys = [...legacyKeys, "inherited", "requestedScopeType", "requestedScopeId"];
  const validSetShape = record(value?.filterSet) &&
    (exact(value.filterSet, legacyKeys) || exact(value.filterSet, provenanceKeys));
  return exact(value, ["apiVersion", "resolvedHost", "siteId", "filterSet"]) &&
    value.apiVersion === 1 && value.resolvedHost === host && text(value.siteId) &&
    validSetShape &&
    [value.filterSet.id, value.filterSet.name, value.filterSet.scopeType].every(text) &&
    (value.filterSet.scopeId === null || text(value.filterSet.scopeId)) &&
    (!Object.hasOwn(value.filterSet, "inherited") ||
      (typeof value.filterSet.inherited === "boolean" &&
       text(value.filterSet.requestedScopeType) &&
       (value.filterSet.requestedScopeId === null || text(value.filterSet.requestedScopeId)))) &&
    Array.isArray(value.filterSet.items) && value.filterSet.items.every(item);
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
  if (query.search) params.set("search", query.search);
  if (query.sort && query.sort !== "featured") params.set("sort", query.sort);
  if (query.minPrice !== undefined && query.minPrice !== "") params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined && query.maxPrice !== "") params.set("maxPrice", String(query.maxPrice));
  if (query.inStock) params.set("inStock", "true");
  for (const [key, values] of Object.entries(query.filters ?? {})) {
    if (values.length) params.set(`f.${key}`, values.join(","));
  }
  if (query.collectionId) params.set("collectionId", query.collectionId);
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.source === "category") params.set("includeSubcategories", String(Boolean(query.includeSubcategories)));
  for (const id of query.productIds ?? []) params.append("productId", id);
  return getJson(`${root}/public/storefront/v1/products?${params}`, host, isProductsResponse, fetchImpl);
}

export async function loadPublicFilterConfiguration(host, scope = {}, options = {}) {
  const baseUrl = options.baseUrl ?? process.env.MOONA365_API_URL;
  if (!baseUrl) throw new Error("MOONA365_API_URL is required");
  const fetchImpl = options.fetchImpl ?? fetch;
  const params = new URLSearchParams({ host });
  if (scope.scopeType) params.set("scopeType", scope.scopeType);
  if (scope.scopeId) params.set("scopeId", scope.scopeId);
  return getJson(baseUrl.replace(/\/$/, "") + "/public/storefront/v1/filters?" + params, host, isFilterConfigurationResponse, fetchImpl);
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

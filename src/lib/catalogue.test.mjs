import test from "node:test";
import assert from "node:assert/strict";
import { isCategoriesResponse, isCollectionsResponse, isFilterConfigurationResponse, isProductsResponse, loadHomepageCatalogue, loadPublicCategories, loadPublicCollections, loadPublicFilterConfiguration, loadPublicProducts } from "./catalogue-core.mjs";

const host = "shop.example.com";
const collectionResponse = {
  apiVersion: 1,
  resolvedHost: host,
  siteId: "site-1",
  calculatedAt: "2026-09-19T00:00:00.000Z",
  collections: [{ id: "c1", name: "Pantry", slug: "pantry", path: "/collections/pantry", description: "", image: null }],
};
const productResponse = {
  apiVersion: 1,
  resolvedHost: host,
  siteId: "site-1",
  calculatedAt: "2026-09-19T00:00:00.000Z",
  pagination: { page: 1, pageSize: 12, total: 1, pageCount: 1 },
  products: [{ id: "p1", slug: "almonds", name: "Almonds", shortDescription: "", primaryImage: null, collectionIds: ["c1"], variants: [{ id: "v1", label: "100g", primaryImage: null, price: { amount: "8.50", currency: "SGD" }, availability: "AVAILABLE", purchasable: true }] }],
};
const categoryResponse = {
  apiVersion: 1,
  resolvedHost: host,
  siteId: "site-1",
  calculatedAt: "2026-09-19T00:00:00.000Z",
  categories: [{ id: "pantry", name: "Pantry", parentId: null, path: "Pantry", image: null, hasChildren: true }],
};
const filterResponse = {
  apiVersion: 1,
  resolvedHost: host,
  siteId: "site-1",
  filterSet: { id: "filters-1", name: "Default", scopeType: "DEFAULT", scopeId: null, items: [{ key: "price", sourceType: "PRICE", customerLabel: "Price", presentation: "PRICE_RANGE", multipleSelection: false, showProductCount: false, maxInitiallyVisible: 5, valueSort: "MANUAL" }] },
};

test("validates bounded public catalogue responses and rejects private fields", () => {
  assert.equal(isCollectionsResponse(collectionResponse, host), true);
  assert.equal(isCategoriesResponse(categoryResponse, host), true);
  assert.equal(isProductsResponse(productResponse, host), true);
  assert.equal(isFilterConfigurationResponse(filterResponse, host), true);
  assert.equal(isFilterConfigurationResponse({
    ...filterResponse,
    filterSet: {
      ...filterResponse.filterSet,
      inherited: true,
      requestedScopeType: "CATEGORY",
      requestedScopeId: "biscuits",
    },
  }, host), true);
  const legacyResponse = structuredClone(productResponse);
  delete legacyResponse.products[0].variants[0].primaryImage;
  assert.equal(isProductsResponse(legacyResponse, host), true);
  assert.equal(isProductsResponse({ ...productResponse, orgId: "private" }, host), false);
  assert.equal(isProductsResponse({ ...productResponse, resolvedHost: "other.example.com" }, host), false);
});

test("loads the resolved server-side filter set for a listing scope", async () => {
  const calls = [];
  const result = await loadPublicFilterConfiguration(host, { scopeType: "CATEGORY", scopeId: "pantry" }, { baseUrl: "https://api.example.com", fetchImpl: async (url) => { calls.push(String(url)); return { ok: true, json: async () => filterResponse }; } });
  assert.deepEqual(result, filterResponse);
  assert.equal(new URL(calls[0]).searchParams.get("scopeType"), "CATEGORY");
  assert.equal(new URL(calls[0]).searchParams.get("scopeId"), "pantry");
});

test("loads only the catalogue required by visible homepage sections", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    return { ok: true, json: async () => String(url).includes("/categories?") ? categoryResponse : productResponse };
  };
  const snapshot = { homepage: { sections: [
    { id: "categories", type: "categories", visible: true, limit: 8, source: { kind: "newest", collectionId: "", productIds: [] } },
    { id: "arrivals", type: "product-showcase", visible: true, limit: 4, source: { kind: "newest", collectionId: "", productIds: [] } },
    { id: "deals", type: "product-showcase", visible: false, limit: 4, source: { kind: "promotions", collectionId: "", productIds: [] } },
  ] } };
  const result = await loadHomepageCatalogue(host, snapshot, { baseUrl: "https://api.example.com", fetchImpl });
  assert.equal(calls.length, 2);
  assert.deepEqual(result.categories, categoryResponse.categories);
  assert.deepEqual(result.productsBySectionId.arrivals, productResponse.products);
});

test("loads each collection tab so later tabs are not limited by the first product page", async () => {
  const calls = [];
  const pantry = { ...productResponse, products: [{ ...productResponse.products[0], id: "pantry-product", collectionIds: ["pantry"] }] };
  const home = { ...productResponse, products: [{ ...productResponse.products[0], id: "home-product", collectionIds: ["home"] }] };
  const fetchImpl = async (url) => {
    const value = String(url);
    calls.push(value);
    const collectionId = new URL(value).searchParams.get("collectionId");
    return { ok: true, json: async () => collectionId === "pantry" ? pantry : home };
  };
  const snapshot = { homepage: { sections: [{
    id: "products", type: "product-showcase", visible: true, limit: 4,
    source: { kind: "newest", collectionId: "", productIds: [] },
    tabs: [{ id: "pantry-tab", label: "Pantry", collectionId: "pantry" }, { id: "home-tab", label: "Home", collectionId: "home" }],
  }] } };
  const result = await loadHomepageCatalogue(host, snapshot, { baseUrl: "https://api.example.com", fetchImpl });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map((url) => new URL(url).searchParams.get("collectionId")), ["pantry", "home"]);
  assert.deepEqual(result.productsBySectionId.products.map((product) => product.id), ["pantry-product", "home-product"]);
});

test("loads tenant-scoped category, collection and selected-product destinations", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    return { ok: true, json: async () => String(url).includes("/collections?") ? collectionResponse : productResponse };
  };
  assert.deepEqual(await loadPublicCollections(host, { baseUrl: "https://api.example.com", fetchImpl }), collectionResponse);
  assert.deepEqual(await loadPublicCategories(host, { baseUrl: "https://api.example.com", fetchImpl: async () => ({ ok: true, json: async () => categoryResponse }) }), categoryResponse);
  assert.deepEqual(await loadPublicProducts(host, { source: "manual", productIds: ["p1"], limit: 1 }, { baseUrl: "https://api.example.com", fetchImpl }), productResponse);
  await loadPublicProducts(host, { source: "category", categoryId: "pantry", includeSubcategories: true }, { baseUrl: "https://api.example.com", fetchImpl });
  assert.match(calls[0], /collections\?host=shop%2Eexample%2Ecom|collections\?host=shop\.example\.com/);
  assert.match(calls[1], /source=manual/);
  assert.match(calls[1], /productId=p1/);
  assert.match(calls[2], /source=category/);
  assert.match(calls[2], /categoryId=pantry/);
  assert.match(calls[2], /includeSubcategories=true/);
});

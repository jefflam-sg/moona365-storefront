import test from "node:test";
import assert from "node:assert/strict";
import { isCollectionsResponse, isProductsResponse, loadHomepageCatalogue, loadPublicCollections, loadPublicProducts } from "./catalogue-core.mjs";

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
  products: [{ id: "p1", slug: "almonds", name: "Almonds", shortDescription: "", primaryImage: null, collectionIds: ["c1"], variants: [{ id: "v1", label: "100g", price: { amount: "8.50", currency: "SGD" }, availability: "AVAILABLE", purchasable: true }] }],
};

test("validates bounded public catalogue responses and rejects private fields", () => {
  assert.equal(isCollectionsResponse(collectionResponse, host), true);
  assert.equal(isProductsResponse(productResponse, host), true);
  assert.equal(isProductsResponse({ ...productResponse, orgId: "private" }, host), false);
  assert.equal(isProductsResponse({ ...productResponse, resolvedHost: "other.example.com" }, host), false);
});

test("loads only the catalogue required by visible homepage sections", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    return { ok: true, json: async () => String(url).includes("/collections?") ? collectionResponse : productResponse };
  };
  const snapshot = { homepage: { sections: [
    { id: "categories", type: "categories", visible: true, limit: 8, source: { kind: "newest", collectionId: "", productIds: [] } },
    { id: "arrivals", type: "product-showcase", visible: true, limit: 4, source: { kind: "newest", collectionId: "", productIds: [] } },
    { id: "deals", type: "product-showcase", visible: false, limit: 4, source: { kind: "promotions", collectionId: "", productIds: [] } },
  ] } };
  const result = await loadHomepageCatalogue(host, snapshot, { baseUrl: "https://api.example.com", fetchImpl });
  assert.equal(calls.length, 2);
  assert.deepEqual(result.collections, collectionResponse.collections);
  assert.deepEqual(result.productsBySectionId.arrivals, productResponse.products);
});

test("loads tenant-scoped collection and selected-product destinations", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    return { ok: true, json: async () => String(url).includes("/collections?") ? collectionResponse : productResponse };
  };
  assert.deepEqual(await loadPublicCollections(host, { baseUrl: "https://api.example.com", fetchImpl }), collectionResponse);
  assert.deepEqual(await loadPublicProducts(host, { source: "manual", productIds: ["p1"], limit: 1 }, { baseUrl: "https://api.example.com", fetchImpl }), productResponse);
  assert.match(calls[0], /collections\?host=shop%2Eexample%2Ecom|collections\?host=shop\.example\.com/);
  assert.match(calls[1], /source=manual/);
  assert.match(calls[1], /productId=p1/);
});

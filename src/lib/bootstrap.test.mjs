import assert from "node:assert/strict";
import test from "node:test";
import {
  exchangePreviewToken,
  isPublicBootstrap,
  isPreviewBootstrap,
  normalizeRequestedHost,
  resolvePublishedStorefront,
} from "./bootstrap-core.mjs";

const responseFor = (host, siteId) => ({
  apiVersion: 1,
  resolvedHost: host,
  canonicalHost: host,
  siteId,
  websiteStatus: "LIVE",
  publishedRevision: "1",
  publishedAt: "2026-09-19T00:00:00.000Z",
  snapshot: {
    contractVersion: 1,
    theme: { code: "retail-natural", version: 1 },
    design: {},
    homepage: {
      schemaVersion: 1,
      sections: [
        { id: "hero", type: "hero", version: 1, visible: true },
      ],
    },
  },
});

test("normalizes DNS hosts and rejects local or malformed hosts", () => {
  assert.equal(
    normalizeRequestedHost(" Shop.Example.com:443. "),
    "shop.example.com",
  );
  assert.equal(normalizeRequestedHost("Shop.Example.com:443"), "shop.example.com");
  for (const host of ["localhost", "127.0.0.1", "bad/path.com", "-bad.com"])
    assert.equal(normalizeRequestedHost(host), null);
});

test("keeps tenant bootstrap responses isolated by the verified requested host", async () => {
  const seen = [];
  const fetchImpl = async (url) => {
    const host = new URL(url).searchParams.get("host");
    seen.push(host);
    return new Response(JSON.stringify(responseFor(host, `site-${host}`)), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const a = await resolvePublishedStorefront("alpha.example.com", {
    baseUrl: "https://api.example.com",
    fetchImpl,
  });
  const b = await resolvePublishedStorefront("beta.example.com", {
    baseUrl: "https://api.example.com",
    fetchImpl,
  });
  assert.deepEqual(seen, ["alpha.example.com", "beta.example.com"]);
  assert.equal(a.siteId, "site-alpha.example.com");
  assert.equal(b.siteId, "site-beta.example.com");
});

test("rejects a response for another tenant and any private extra field", () => {
  assert.equal(
    isPublicBootstrap(responseFor("beta.example.com", "site-b"), "alpha.example.com"),
    false,
  );
  assert.equal(
    isPublicBootstrap(
      { ...responseFor("alpha.example.com", "site-a"), draftConfig: {} },
      "alpha.example.com",
    ),
    false,
  );
});

test("accepts published Content Columns sections", () => {
  const response = responseFor("alpha.example.com", "site-a");
  response.snapshot.homepage.sections = [
    { id: "story", type: "content-columns", version: 1, visible: true },
  ];
  assert.equal(isPublicBootstrap(response, "alpha.example.com"), true);
});

test("returns no tenant for backend 404 without inventing a fallback", async () => {
  const result = await resolvePublishedStorefront("unknown.example.com", {
    baseUrl: "https://api.example.com",
    fetchImpl: async () => new Response(null, { status: 404 }),
  });
  assert.equal(result, null);
});

test("accepts only non-commerce preview snapshots and posts the token in a body", async () => {
  const preview = {
    apiVersion: 1,
    siteId: "site-a",
    draftRevision: "7",
    snapshot: responseFor("alpha.example.com", "site-a").snapshot,
    commerceEnabled: false,
  };
  let request;
  const result = await exchangePreviewToken("x".repeat(64), {
    baseUrl: "https://api.example.com",
    fetchImpl: async (url, init) => {
      request = { url, init };
      return new Response(JSON.stringify(preview), { status: 200 });
    },
  });
  assert.equal(result.siteId, "site-a");
  assert.equal(request.url, "https://api.example.com/public/storefront/v1/preview");
  assert.deepEqual(JSON.parse(request.init.body), { token: "x".repeat(64) });
  assert.equal(isPreviewBootstrap({ ...preview, commerceEnabled: true }), false);
});

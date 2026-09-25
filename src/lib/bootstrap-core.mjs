import { domainToASCII } from "node:url";
import { isIP } from "node:net";

const bootstrapKeys = [
  "apiVersion",
  "resolvedHost",
  "canonicalHost",
  "siteId",
  "websiteStatus",
  "publishedRevision",
  "publishedAt",
  "snapshot",
];
const legacySnapshotKeys = ["contractVersion", "theme", "design", "homepage"];
const navigationSnapshotKeys = [...legacySnapshotKeys, "navigation"];
const pagesSnapshotKeys = [...legacySnapshotKeys, "pages"];
const pagesNavigationSnapshotKeys = [...legacySnapshotKeys, "pages", "navigation"];
const registeredBlocks = new Set([
  "hero",
  "categories",
  "featured-collection",
  "product-showcase",
  "stats",
  "services",
  "brand-values",
  "product-page-brand-values",
  "articles",
  "newsletter",
  "category-cards",
  "services-showcase-grouped",
  "content-columns",
]);

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const hasExactKeys = (value, keys) =>
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key));

export function normalizeRequestedHost(value) {
  if (typeof value !== "string") return null;
  const candidate = value.trim().toLowerCase().replace(/\.$/, "");
  const withoutPort = candidate.replace(/:\d{1,5}$/, "");
  if (
    !withoutPort ||
    withoutPort === "localhost" ||
    withoutPort.includes("/") ||
    withoutPort.includes("\\") ||
    withoutPort.includes("..")
  )
    return null;
  const ascii = domainToASCII(withoutPort);
  if (!ascii || ascii.length > 253 || isIP(ascii) !== 0) return null;
  const labels = ascii.split(".");
  if (
    labels.length < 2 ||
    labels.some(
      (label) =>
        !label ||
        label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
    )
  )
    return null;
  return ascii;
}

function isSnapshotEnvelope(value) {
  if (
    !isRecord(value) ||
    (![legacySnapshotKeys, navigationSnapshotKeys, pagesSnapshotKeys, pagesNavigationSnapshotKeys].some((keys) => hasExactKeys(value, keys))) ||
    value.contractVersion !== 1 ||
    !isRecord(value.theme) ||
    !hasExactKeys(value.theme, ["code", "version"]) ||
    value.theme.code !== "retail-natural" ||
    value.theme.version !== 1 ||
    !isRecord(value.design) ||
    !isRecord(value.homepage) ||
    !hasExactKeys(value.homepage, ["schemaVersion", "sections"]) ||
    value.homepage.schemaVersion !== 1 ||
    !Array.isArray(value.homepage.sections) ||
    value.homepage.sections.length > 20 ||
    (value.pages !== undefined && (!isRecord(value.pages) || !(["product"].every((key) => Object.hasOwn(value.pages, key)) && Object.keys(value.pages).every((key) => ["product", "custom"].includes(key))) || !isRecord(value.pages.product) || !hasExactKeys(value.pages.product, ["schemaVersion", "sections"]) || value.pages.product.schemaVersion !== 1 || !Array.isArray(value.pages.product.sections) || value.pages.product.sections.length > 20 || (value.pages.custom !== undefined && (!Array.isArray(value.pages.custom) || value.pages.custom.length > 30))))
  )
    return false;

  const validSections = (sections) => {
    const ids = new Set();
    return sections.every((section) => {
    if (
      !isRecord(section) ||
      typeof section.id !== "string" ||
      !section.id ||
      ids.has(section.id) ||
      typeof section.type !== "string" ||
      !registeredBlocks.has(section.type) ||
      section.version !== 1 ||
      typeof section.visible !== "boolean"
    )
      return false;
    ids.add(section.id);
    return true;
    });
  };
  const customPages = value.pages?.custom ?? [];
  const pageIds = new Set();
  const pageSlugs = new Set();
  const validPages = customPages.every((page) => {
    if (!isRecord(page) || !hasExactKeys(page, ["id", "title", "slug", "status", "seo", "schemaVersion", "sections"]) || typeof page.id !== "string" || !page.id || page.id.length > 80 || pageIds.has(page.id) || typeof page.title !== "string" || !page.title.trim() || page.title.length > 120 || typeof page.slug !== "string" || page.slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug) || pageSlugs.has(page.slug) || !["ACTIVE", "ARCHIVED"].includes(page.status) || page.schemaVersion !== 1 || !Array.isArray(page.sections) || page.sections.length > 20 || !validSections(page.sections) || !isRecord(page.seo) || !hasExactKeys(page.seo, ["title", "description", "image"]) || typeof page.seo.title !== "string" || page.seo.title.length > 70 || typeof page.seo.description !== "string" || page.seo.description.length > 320) return false;
    const image = page.seo.image;
    if (image !== null && (!isRecord(image) || !hasExactKeys(image, ["src", "alt"]) || typeof image.src !== "string" || !image.src || image.src.length > 750000 || typeof image.alt !== "string" || image.alt.length > 120)) return false;
    pageIds.add(page.id); pageSlugs.add(page.slug); return true;
  });
  return validSections(value.homepage.sections) && (value.pages === undefined || validSections(value.pages.product.sections) && validPages);
}

export function isPublicBootstrap(value, requestedHost) {
  return (
    isRecord(value) &&
    hasExactKeys(value, bootstrapKeys) &&
    value.apiVersion === 1 &&
    value.resolvedHost === requestedHost &&
    typeof value.canonicalHost === "string" &&
    normalizeRequestedHost(value.canonicalHost) === value.canonicalHost &&
    typeof value.siteId === "string" &&
    value.siteId.length > 0 &&
    (value.websiteStatus === "LIVE" || value.websiteStatus === "MAINTENANCE") &&
    typeof value.publishedRevision === "string" &&
    value.publishedRevision.length > 0 &&
    typeof value.publishedAt === "string" &&
    !Number.isNaN(Date.parse(value.publishedAt)) &&
    isSnapshotEnvelope(value.snapshot)
  );
}

export function isPreviewBootstrap(value) {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "apiVersion",
      "siteId",
      "draftRevision",
      "snapshot",
      "commerceEnabled",
    ]) &&
    value.apiVersion === 1 &&
    typeof value.siteId === "string" &&
    value.siteId.length > 0 &&
    typeof value.draftRevision === "string" &&
    value.draftRevision.length > 0 &&
    value.commerceEnabled === false &&
    isSnapshotEnvelope(value.snapshot)
  );
}

export async function resolvePublishedStorefront(host, options = {}) {
  const requestedHost = normalizeRequestedHost(host);
  if (!requestedHost) return null;
  const baseUrl = options.baseUrl ?? process.env.MOONA365_API_URL;
  if (!baseUrl) throw new Error("MOONA365_API_URL is required");
  const request = options.fetchImpl ?? fetch;
  const response = await request(
    `${baseUrl.replace(/\/$/, "")}/public/storefront/v1/bootstrap?host=${encodeURIComponent(requestedHost)}`,
    { cache: "no-store", headers: { Accept: "application/json" } },
  );
  if (response.status === 404 || response.status === 503) return null;
  if (!response.ok) throw new Error(`Bootstrap failed (${response.status})`);
  const value = await response.json();
  if (!isPublicBootstrap(value, requestedHost))
    throw new Error("Invalid or unsupported bootstrap contract");
  return value;
}

export async function exchangePreviewToken(token, options = {}) {
  if (typeof token !== "string" || token.length < 32 || token.length > 4096)
    throw new Error("Invalid preview credential");
  const baseUrl = options.baseUrl ?? process.env.MOONA365_API_URL;
  if (!baseUrl) throw new Error("MOONA365_API_URL is required");
  const request = options.fetchImpl ?? fetch;
  const response = await request(
    `${baseUrl.replace(/\/$/, "")}/public/storefront/v1/preview`,
    {
      method: "POST",
      cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    },
  );
  if (response.status === 404 || response.status === 410) return null;
  if (!response.ok) throw new Error(`Preview exchange failed (${response.status})`);
  const value = await response.json();
  if (!isPreviewBootstrap(value))
    throw new Error("Invalid or unsupported preview contract");
  return value;
}

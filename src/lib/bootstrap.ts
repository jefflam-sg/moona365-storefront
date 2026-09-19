import {
  exchangePreviewToken as exchange,
  resolvePublishedStorefront as resolve,
} from "./bootstrap-core.mjs";
import type { StorefrontSnapshot } from "@/storefront/contracts";

export type { StorefrontSnapshot } from "@/storefront/contracts";

export type PublicStorefrontBootstrap = {
  apiVersion: 1;
  resolvedHost: string;
  canonicalHost: string;
  siteId: string;
  websiteStatus: "LIVE" | "MAINTENANCE";
  publishedRevision: string;
  publishedAt: string;
  snapshot: StorefrontSnapshot;
};

export type PreviewStorefrontBootstrap = {
  apiVersion: 1;
  siteId: string;
  draftRevision: string;
  snapshot: StorefrontSnapshot;
  commerceEnabled: false;
};

export async function resolvePublishedStorefront(
  host: string,
): Promise<PublicStorefrontBootstrap | null> {
  return (await resolve(host)) as PublicStorefrontBootstrap | null;
}

export async function exchangePreviewToken(
  token: string,
): Promise<PreviewStorefrontBootstrap | null> {
  return (await exchange(token)) as PreviewStorefrontBootstrap | null;
}

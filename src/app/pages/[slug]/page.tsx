import type { Metadata } from "next";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadHomepageCatalogue } from "@/lib/catalogue";
import { MaintenancePage } from "@/storefront/catalogue-page";
import { StorefrontRenderer, supportsPublishedSnapshot } from "@/storefront/storefront-renderer";

export const dynamic = "force-dynamic";

const pageRecord = cache(async (slug: string) => {
  const host = (await headers()).get("host");
  if (!host) return null;
  const result = await resolvePublishedStorefront(host);
  if (!result || !supportsPublishedSnapshot(result.snapshot)) return null;
  const page = result.snapshot.pages?.custom?.find((entry) => entry.status === "ACTIVE" && entry.slug === slug);
  return page ? { result, page } : null;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const record = await pageRecord(slug);
  if (!record) return {};
  const { page } = record;
  return {
    title: page.seo.title.trim() || page.title,
    description: page.seo.description.trim() || undefined,
    openGraph: page.seo.image ? { images: [{ url: page.seo.image.src, alt: page.seo.image.alt }] } : undefined,
  };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = await pageRecord(slug);
  if (!record) notFound();
  const { result, page } = record;
  if (result.websiteStatus === "MAINTENANCE") return <MaintenancePage snapshot={result.snapshot} />;
  const pageSnapshot = { ...result.snapshot, homepage: { schemaVersion: 1 as const, sections: page.sections } };
  const catalogue = await loadHomepageCatalogue(result.resolvedHost, pageSnapshot);
  if (!catalogue) notFound();
  return <StorefrontRenderer snapshot={pageSnapshot} catalogue={catalogue} />;
}

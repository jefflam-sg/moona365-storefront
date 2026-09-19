import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadStorefrontCollections } from "@/lib/catalogue";
import { CollectionCard, StorefrontPageShell } from "@/storefront/catalogue-page";

export const dynamic = "force-dynamic";
export default async function CollectionsPage() {
  const host = (await headers()).get("host");
  if (!host) notFound();
  const result = await resolvePublishedStorefront(host);
  if (!result) notFound();
  const collections = await loadStorefrontCollections(result.resolvedHost);
  if (!collections) notFound();
  return <StorefrontPageShell snapshot={result.snapshot}><header className="sf-page-heading"><span className="sf-eyebrow">SHOP</span><h1>Collections</h1><p>Browse our available ranges.</p></header><div className="sf-category-grid">{collections.map((collection) => <CollectionCard key={collection.id} collection={collection} />)}</div></StorefrontPageShell>;
}

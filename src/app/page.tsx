import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadHomepageCatalogue } from "@/lib/catalogue";
import { StorefrontRenderer, supportsPublishedSnapshot } from "@/storefront/storefront-renderer";
export const dynamic = "force-dynamic";
export default async function Home() {
  const host=(await headers()).get("host");
  if(!host) notFound();
  const result=await resolvePublishedStorefront(host);
  if(!result) notFound();
  if(!supportsPublishedSnapshot(result.snapshot)) notFound();
  const catalogue=await loadHomepageCatalogue(result.resolvedHost,result.snapshot);
  if(!catalogue) notFound();
  return <StorefrontRenderer snapshot={result.snapshot} catalogue={catalogue} />;
}

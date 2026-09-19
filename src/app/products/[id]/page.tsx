import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadStorefrontProducts } from "@/lib/catalogue";
import { ProductDetail, StorefrontPageShell } from "@/storefront/catalogue-page";

export const dynamic = "force-dynamic";
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const host = (await headers()).get("host");
  if (!host) notFound();
  const result = await resolvePublishedStorefront(host);
  if (!result) notFound();
  const id = (await params).id;
  const products = await loadStorefrontProducts(result.resolvedHost, { source: "manual", productIds: [id], limit: 1 });
  const product = products?.find((entry) => entry.id === id);
  if (!product) notFound();
  return <StorefrontPageShell snapshot={result.snapshot}><ProductDetail product={product} /></StorefrontPageShell>;
}

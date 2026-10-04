import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { resolvePublishedStorefront } from "@/lib/bootstrap";
import { loadNavigationCatalogue } from "@/lib/catalogue";
import { StorefrontPageShell } from "@/storefront/catalogue-page";
import { supportsPublishedSnapshot } from "@/storefront/storefront-renderer";

export const dynamic = "force-dynamic";

export default async function CustomerAccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const host = (await headers()).get("host");
  if (!host) notFound();
  const result = await resolvePublishedStorefront(host);
  if (!result || !supportsPublishedSnapshot(result.snapshot)) notFound();
  const catalogue = await loadNavigationCatalogue(
    result.resolvedHost,
    result.snapshot,
  );
  return (
    <StorefrontPageShell
      snapshot={result.snapshot}
      catalogue={catalogue ?? undefined}
    >
      {children}
    </StorefrontPageShell>
  );
}

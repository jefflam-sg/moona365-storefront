import Link from "next/link";
import type { ReactNode } from "react";
import type { HomepageCatalogue, PublicCategory, PublicCollection, StorefrontSnapshot } from "./contracts";
import { StorefrontFooter } from "./footer";
import { StorefrontHeader } from "./header";
import { safeImageSource } from "./safe-values";
import { themeVariables } from "./theme";
import { categoryHref } from "./category-url";
export { ProductDetail } from "./product-detail";
export { ProductCard } from "./product-card";

/* Tenant-configured catalogue images are validated by the public API. */
/* eslint-disable @next/next/no-img-element */

export function StorefrontPageShell({ snapshot, children, catalogue }: { snapshot: StorefrontSnapshot; children: ReactNode; catalogue?: HomepageCatalogue }) {
  return <div className="sf-site" style={themeVariables(snapshot.design)}><StorefrontHeader design={snapshot.design} preview={false} navigation={snapshot.navigation} catalogue={catalogue} /><main className="sf-catalogue-page sf-width">{children}</main><StorefrontFooter design={snapshot.design} navigation={snapshot.navigation} catalogue={catalogue} /></div>;
}

export function MaintenancePage({ snapshot }: { snapshot: StorefrontSnapshot }) {
  return <StorefrontPageShell snapshot={snapshot}><section className="status"><h1>We&apos;ll be back shortly</h1><p>This store is temporarily unavailable while updates are completed. Please check again soon.</p></section></StorefrontPageShell>;
}

export function CatalogueUnavailablePage({ snapshot }: { snapshot: StorefrontSnapshot }) {
  return <StorefrontPageShell snapshot={snapshot}><section className="status"><h1>Products are temporarily unavailable</h1><p>We could not load the catalogue just now. Please refresh the page in a moment.</p></section></StorefrontPageShell>;
}

export function CollectionCard({ collection }: { collection: PublicCollection }) {
  const src = collection.image ? safeImageSource(collection.image.src) : null;
  return <Link className="sf-category-card sf-card-link" href={`/collections/${collection.slug}`}>{collection.image && src ? <img src={src} alt={collection.image.alt} /> : <div className="sf-catalogue-placeholder" aria-hidden="true" />}<div><h3>{collection.name}</h3>{collection.description && <p>{collection.description}</p>}</div></Link>;
}

export function CategoryCard({ category }: { category: PublicCategory }) {
  const src = category.image ? safeImageSource(category.image.src) : null;
  const href = categoryHref(category);
  return <Link className="sf-category-card sf-card-link" href={href}>{category.image && src ? <img src={src} alt={category.image.alt} /> : <div className="sf-catalogue-placeholder" aria-hidden="true" />}<div><h3>{category.name}</h3></div></Link>;
}

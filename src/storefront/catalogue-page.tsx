import Link from "next/link";
import type { ReactNode } from "react";
import type { PublicCategory, PublicCollection, PublicProduct, StorefrontSnapshot } from "./contracts";
import { StorefrontFooter } from "./footer";
import { StorefrontHeader } from "./header";
import { safeImageSource } from "./safe-values";
import { themeVariables } from "./theme";
import { categoryHref } from "./category-url";

/* Tenant-configured catalogue images are validated by the public API. */
/* eslint-disable @next/next/no-img-element */

export function StorefrontPageShell({ snapshot, children }: { snapshot: StorefrontSnapshot; children: ReactNode }) {
  return <div className="sf-site" style={themeVariables(snapshot.design)}><StorefrontHeader design={snapshot.design} preview={false} /><main className="sf-catalogue-page sf-width">{children}</main><StorefrontFooter design={snapshot.design} /></div>;
}

export function MaintenancePage({ snapshot }: { snapshot: StorefrontSnapshot }) {
  return <StorefrontPageShell snapshot={snapshot}><section className="status"><h1>We&apos;ll be back shortly</h1><p>This store is temporarily unavailable while updates are completed. Please check again soon.</p></section></StorefrontPageShell>;
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

function money(product: PublicProduct) {
  const variant = product.variants.find((entry) => entry.purchasable) ?? product.variants[0];
  if (!variant) return null;
  try { return new Intl.NumberFormat("en-SG", { style: "currency", currency: variant.price.currency }).format(Number(variant.price.amount)); }
  catch { return `${variant.price.currency} ${variant.price.amount}`; }
}

export function ProductCard({ product }: { product: PublicProduct }) {
  const src = product.primaryImage ? safeImageSource(product.primaryImage.src) : null;
  const available = product.variants.some((variant) => variant.purchasable);
  return <Link className="sf-product-card sf-card-link" href={`/products/${product.id}`}>{product.primaryImage && src ? <img src={src} alt={product.primaryImage.alt} /> : <div className="sf-catalogue-placeholder" aria-hidden="true" />}<div className="sf-product-copy"><h3>{product.name}</h3>{product.shortDescription && <p>{product.shortDescription}</p>}<div><strong>{money(product)}</strong><span>{available ? "Available" : "Sold out"}</span></div></div></Link>;
}

export function ProductDetail({ product }: { product: PublicProduct }) {
  const src = product.primaryImage ? safeImageSource(product.primaryImage.src) : null;
  return <article className="sf-product-detail"><div>{product.primaryImage && src ? <img src={src} alt={product.primaryImage.alt} /> : <div className="sf-catalogue-placeholder" aria-hidden="true" />}</div><div><Link href="/collections" className="sf-back-link">← All collections</Link><h1>{product.name}</h1>{product.shortDescription && <p>{product.shortDescription}</p>}<div className="sf-variant-list">{product.variants.map((variant) => <div key={variant.id}><span>{variant.label}</span><strong>{new Intl.NumberFormat("en-SG", { style: "currency", currency: variant.price.currency }).format(Number(variant.price.amount))}</strong><small>{variant.purchasable ? "Available" : "Sold out"}</small></div>)}</div></div></article>;
}

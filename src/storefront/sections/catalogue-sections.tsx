"use client";

/* Tenant-configured catalogue images are validated HTTPS/path URLs at the API boundary. */
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { HomepageCatalogue, HomepageSection, PublicProduct } from "../contracts";
import { safeImageSource } from "../safe-values";
import { SectionAction } from "./section-action";

function money(product: PublicProduct) {
  const variant = product.variants.find((entry) => entry.purchasable) ?? product.variants[0];
  if (!variant) return null;
  try {
    return new Intl.NumberFormat("en-SG", { style: "currency", currency: variant.price.currency }).format(Number(variant.price.amount));
  } catch {
    return `${variant.price.currency} ${variant.price.amount}`;
  }
}

export function CategoriesSection({ section, preview, catalogue }: { section: HomepageSection; preview: boolean; catalogue: HomepageCatalogue }) {
  const collections = catalogue.collections.slice(0, section.limit);
  return <section className="sf-section sf-categories" data-layout={section.layout}>
    <div className="sf-heading-with-action"><div className="sf-section-heading">{section.eyebrow && <span className="sf-eyebrow">{section.eyebrow}</span>}<h2>{section.heading}</h2>{section.description && <p>{section.description}</p>}</div><SectionAction section={section} preview={preview} secondary /></div>
    <div className="sf-category-grid">{collections.map((collection) => { const src=collection.image ? safeImageSource(collection.image.src) : null; return <article className="sf-category-card" key={collection.id}>{collection.image && src ? <img src={src} alt={collection.image.alt} /> : <div className="sf-catalogue-placeholder" aria-hidden="true" />}<div><h3>{collection.name}</h3>{collection.description && <p>{collection.description}</p>}</div></article>; })}</div>
    {!collections.length && preview && <p className="sf-empty">No published collections yet.</p>}
  </section>;
}

export function ProductShowcaseSection({ section, preview, catalogue }: { section: HomepageSection; preview: boolean; catalogue: HomepageCatalogue }) {
  const products = catalogue.productsBySectionId[section.id] ?? [];
  const [activeTab, setActiveTab] = useState(section.tabs[0]?.id ?? "");
  const tab = section.tabs.find((entry) => entry.id === activeTab);
  const visibleProducts = (tab?.collectionId ? products.filter((product) => product.collectionIds.includes(tab.collectionId)) : products).slice(0, section.limit);
  return <section className="sf-section sf-product-showcase" data-layout={section.layout}>
    <div className="sf-heading-with-action"><div className="sf-section-heading">{section.eyebrow && <span className="sf-eyebrow">{section.eyebrow}</span>}<h2>{section.heading}</h2>{section.description && <p>{section.description}</p>}</div><SectionAction section={section} preview={preview} secondary /></div>
    {section.tabs.length > 0 && <div className="sf-catalogue-tabs" aria-label="Product collections">{section.tabs.map((entry) => <button type="button" key={entry.id} data-active={entry.id === activeTab} onClick={() => setActiveTab(entry.id)}>{entry.label}</button>)}</div>}
    <div className="sf-product-grid">{visibleProducts.map((product) => { const available=product.variants.some((variant) => variant.purchasable); const src=product.primaryImage ? safeImageSource(product.primaryImage.src) : null; return <article className="sf-product-card" key={product.id}>{product.primaryImage && src ? <img src={src} alt={product.primaryImage.alt} /> : <div className="sf-catalogue-placeholder" aria-hidden="true" />}<div className="sf-product-copy"><h3>{product.name}</h3>{product.shortDescription && <p>{product.shortDescription}</p>}<div><strong>{money(product)}</strong><span>{available ? "Available" : "Sold out"}</span></div></div></article>; })}</div>
    {!visibleProducts.length && preview && <p className="sf-empty">No website products match this section yet.</p>}
  </section>;
}

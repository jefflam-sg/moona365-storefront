"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PublicProduct } from "./contracts";
import { safeImageSource } from "./safe-values";

/* Tenant media sources are validated by the public catalogue boundary. */
/* eslint-disable @next/next/no-img-element */

export function ProductDetail({ product }: { product: PublicProduct }) {
  const initialVariant = product.variants.find((variant) => variant.purchasable) ?? product.variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariant?.id ?? "");
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? initialVariant;
  const selectedImage = selectedVariant?.primaryImage ?? product.primaryImage;
  const imageSource = selectedImage ? safeImageSource(selectedImage.src) : null;
  const preloadSources = useMemo(() => Array.from(new Set(product.variants.map((variant) => variant.primaryImage ? safeImageSource(variant.primaryImage.src) : null).filter((source): source is string => Boolean(source)))), [product.variants]);

  useEffect(() => {
    preloadSources.forEach((source) => { const image = new Image(); image.src = source; });
  }, [preloadSources]);

  return <article className="sf-product-detail">
    <div className="sf-product-detail-image">{selectedImage && imageSource ? <img src={imageSource} alt={selectedImage.alt || product.name} /> : <div className="sf-catalogue-placeholder" aria-hidden="true" />}</div>
    <div><Link href="/collections" className="sf-back-link">← All collections</Link><h1>{product.name}</h1>{product.shortDescription && <p>{product.shortDescription}</p>}
      <div className="sf-variant-list" role="radiogroup" aria-label="Product variant">{product.variants.map((variant) => <button type="button" role="radio" aria-checked={variant.id === selectedVariant?.id} className={variant.id === selectedVariant?.id ? "is-selected" : ""} key={variant.id} onClick={() => setSelectedVariantId(variant.id)}><span>{variant.label || "Standard"}</span><strong>{new Intl.NumberFormat("en-SG", { style: "currency", currency: variant.price.currency }).format(Number(variant.price.amount))}</strong><small>{variant.purchasable ? "Available" : "Sold out"}</small></button>)}</div>
    </div>
  </article>;
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PublicProduct } from "./contracts";
import { addCartLine, toggleWishlist, wishlistHas } from "./commerce-local";
import { ProductCard } from "./product-card";
import { safeImageSource } from "./safe-values";

/* Tenant media sources are validated by the public catalogue boundary. */
/* eslint-disable @next/next/no-img-element */

type Variant = PublicProduct["variants"][number];
type ProductImage = { src: string; alt: string };

const money = (amount: string, currency: string) => {
  try { return new Intl.NumberFormat("en-SG", { style: "currency", currency }).format(Number(amount)); }
  catch { return `${currency} ${amount}`; }
};

function productPrice(product: PublicProduct, selected?: Variant) {
  if (selected) return money(selected.price.amount, selected.price.currency);
  const variants = product.variants.filter((variant) => variant.purchasable);
  const values = [...(variants.length ? variants : product.variants)].sort((a, b) => Number(a.price.amount) - Number(b.price.amount));
  if (!values.length) return "";
  const low = values[0]; const high = values[values.length - 1];
  return Number(low.price.amount) === Number(high.price.amount) ? money(low.price.amount, low.price.currency) : `${money(low.price.amount, low.price.currency)} – ${money(high.price.amount, high.price.currency)}`;
}

export function ProductDetail({ product, recommendations = [], frequentlyBoughtTogether = [] }: { product: PublicProduct; recommendations?: PublicProduct[]; frequentlyBoughtTogether?: PublicProduct[] }) {
  const initialVariant = product.variants.length === 1 ? product.variants[0] : undefined;
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariant?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [notice, setNotice] = useState("");
  const [fullScreen, setFullScreen] = useState(false);
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const images = useMemo(() => {
    const values: ProductImage[] = [];
    const add = (image: ProductImage | null | undefined) => {
      const src = image ? safeImageSource(image.src) : null;
      if (src && !values.some((item) => item.src === src)) values.push({ src, alt: image?.alt || product.name });
    };
    add(product.primaryImage);
    product.variants.forEach((variant) => add(variant.primaryImage));
    return values;
  }, [product]);
  const initialImage = selectedVariant?.primaryImage && safeImageSource(selectedVariant.primaryImage.src) ? selectedVariant.primaryImage.src : images[0]?.src ?? "";
  const [activeImage, setActiveImage] = useState(initialImage);
  const activeIndex = Math.max(0, images.findIndex((image) => image.src === activeImage));
  const active = images[activeIndex];

  useEffect(() => {
    const frame = requestAnimationFrame(() => setWishlisted(wishlistHas(product.id)));
    return () => cancelAnimationFrame(frame);
  }, [product.id]);
  useEffect(() => {
    if (!fullScreen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setFullScreen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [fullScreen]);

  const chooseVariant = (variant: Variant) => {
    setSelectedVariantId(variant.id);
    const source = variant.primaryImage ? safeImageSource(variant.primaryImage.src) : null;
    if (source) setActiveImage(source);
    setNotice("");
  };
  const add = () => {
    if (!selectedVariant) { setNotice(`Please select ${product.variantOptionName || "an option"}.`); return; }
    if (!selectedVariant.purchasable) { setNotice("This option is currently unavailable."); return; }
    addCartLine(product.id, selectedVariant.id, quantity);
    setNotice("Added to cart.");
  };
  const moveImage = (direction: -1 | 1) => {
    if (images.length < 2) return;
    setActiveImage(images[(activeIndex + direction + images.length) % images.length].src);
  };

  return <>
    <nav className="sf-breadcrumbs sf-pdp-breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>›<Link href="/shop">Shop</Link></span><span>›<b>{product.name}</b></span></nav>
    <article className="sf-product-detail">
      <section className="sf-pdp-gallery" aria-label={`${product.name} images`}>
        {images.length > 1 && <div className="sf-pdp-thumbnails">{images.map((image, index) => <button type="button" key={image.src} className={index === activeIndex ? "is-active" : ""} aria-label={`View image ${index + 1}`} aria-pressed={index === activeIndex} onClick={() => setActiveImage(image.src)}><img src={image.src} alt="" /></button>)}</div>}
        <div className="sf-product-detail-image">{active ? <img src={active.src} alt={active.alt || product.name} /> : <div className="sf-catalogue-placeholder" aria-hidden="true" />}{product.isNew && <span className="sf-pdp-badge">NEW</span>}{images.length > 1 && <><button type="button" className="sf-pdp-image-arrow sf-pdp-image-previous" aria-label="Previous image" onClick={() => moveImage(-1)}>‹</button><button type="button" className="sf-pdp-image-arrow sf-pdp-image-next" aria-label="Next image" onClick={() => moveImage(1)}>›</button></>} {active && <button type="button" className="sf-pdp-expand" aria-label="View image full screen" onClick={() => setFullScreen(true)}>⛶</button>}</div>
      </section>
      <section className="sf-pdp-summary">
        {product.isNew && <span className="sf-pdp-label">New arrival</span>}
        <h1>{product.name}</h1>
        {product.shortDescription && <p className="sf-pdp-short-description">{product.shortDescription}</p>}
        <strong className="sf-pdp-price">{productPrice(product, selectedVariant)}</strong>
        {product.variants.length > 0 && <fieldset className={`sf-pdp-options ${notice.startsWith("Please") ? "has-missing" : ""}`}><legend>{product.variantOptionName || "Choose an option"}</legend><div>{product.variants.map((variant) => <button type="button" key={variant.id} disabled={!variant.purchasable} aria-pressed={selectedVariantId === variant.id} onClick={() => chooseVariant(variant)}><b>{variant.label || "Standard"}</b><small>{money(variant.price.amount, variant.price.currency)}</small></button>)}</div>{product.variants.length > 1 && selectedVariant && <button className="sf-pdp-clear" type="button" onClick={() => setSelectedVariantId("")}>Clear selection</button>}</fieldset>}
        <div className="sf-pdp-quantity"><span>Quantity</span><div><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><output aria-label="Quantity">{quantity}</output><button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(99, value + 1))}>+</button></div></div>
        <p className="sf-pdp-stock" data-available={Boolean(selectedVariant?.purchasable)}>{selectedVariant ? (selectedVariant.purchasable ? "● In stock" : "Sold out") : `Select ${product.variantOptionName || "an option"} to see availability`}</p>
        <div className="sf-pdp-actions"><button type="button" onClick={add} disabled={Boolean(selectedVariant && !selectedVariant.purchasable)}>Add to Cart</button><button type="button" className="sf-pdp-wishlist" aria-pressed={wishlisted} onClick={() => setWishlisted(toggleWishlist(product.id))}>{wishlisted ? "♥ Saved to Wishlist" : "♡ Add to Wishlist"}</button></div>
        {notice && <p className="sf-pdp-notice" role="status">{notice}</p>}
      </section>
    </article>
    {product.shortDescription && <section className="sf-pdp-description"><h2>Description</h2><p>{product.shortDescription}</p></section>}
    {frequentlyBoughtTogether.length > 0 && <section className="sf-pdp-bundle"><header><h2>Frequently Bought Together</h2><p>Complete your purchase with these popular pairings.</p></header><div className="sf-pdp-bundle-products">{frequentlyBoughtTogether.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    {recommendations.length > 0 && <section className="sf-pdp-related sf-plp-results"><header><div><h2>You May Also Like</h2><p>More products you might enjoy.</p></div><Link href="/shop">View All</Link></header><div className="sf-product-grid sf-pdp-related-products">{recommendations.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    {fullScreen && active && <div className="sf-pdp-lightbox" role="dialog" aria-modal="true" aria-label={`${product.name} full-screen image`} onMouseDown={(event) => event.target === event.currentTarget && setFullScreen(false)}><button type="button" aria-label="Close full-screen image" onClick={() => setFullScreen(false)}>×</button><img src={active.src} alt={active.alt || product.name} /></div>}
  </>;
}

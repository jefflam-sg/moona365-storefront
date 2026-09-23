"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HomepageSection, PublicProduct } from "./contracts";
import { addCartLine, toggleWishlist, wishlistHas } from "./commerce-local";
import { StorefrontIcon } from "./icons";
import { ProductCard } from "./product-card";
import { safeImageSource } from "./safe-values";

/* Tenant media sources are validated by the public catalogue boundary. */
/* eslint-disable @next/next/no-img-element */

type Variant = PublicProduct["variants"][number];
type ProductImage = { src: string; alt: string };

function ShareIcon({ name }: { name: "share" | "whatsapp" | "facebook" | "email" | "pinterest" }) {
  return <svg className={`sf-share-icon sf-share-icon-${name}`} aria-hidden="true" viewBox="0 0 24 24">
    {name === "share" && <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" /></>}
    {name === "whatsapp" && <><path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4.1A8 8 0 1 1 20 11.7Z" /><path d="M9 8.2c.4 3 2 4.6 5 5.5l1.1-1.2 2 .9c-.3 1.5-1.4 2.3-2.8 2.2-4.1-.4-7.1-3.5-7.4-7.3 0-1.2.8-2.2 2.1-2.5l1 2.1Z" /></>}
    {name === "facebook" && <path d="M14 21v-8h3l.5-3H14V8.5c0-1 .4-1.5 1.7-1.5H18V4.2c-.7-.1-1.6-.2-2.7-.2C12.5 4 11 5.6 11 8.2V10H8v3h3v8Z" />}
    {name === "email" && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>}
    {name === "pinterest" && <><circle cx="12" cy="12" r="9" /><path d="M10.5 17.5c1-3.2 1.5-5.1 1.9-7 .3-1.5 2.8-1.2 2.4.8-.5 2.6-3.8 2.6-4.6.5-1-2.8.8-5 3.3-5 3.4 0 5.4 2.4 4.8 5.5-.5 2.4-2 4.3-4.3 4.3-1 0-1.9-.5-2.2-1.2" /></>}
  </svg>;
}

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

export function ProductDetail({ product, recommendations = [], frequentlyBoughtTogether = [], brandValues }: { product: PublicProduct; recommendations?: PublicProduct[]; frequentlyBoughtTogether?: PublicProduct[]; brandValues?: HomepageSection }) {
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
  const share = async (destination: "native" | "whatsapp" | "facebook" | "email" | "pinterest") => {
    const url = window.location.href;
    const title = product.name;
    if (destination === "native") {
      try {
        if (navigator.share) await navigator.share({ title, url });
        else {
          await navigator.clipboard.writeText(url);
          setNotice("Product link copied.");
        }
      } catch { /* The customer may cancel the native share sheet. */ }
      return;
    }
    const targets = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
      pinterest: `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`,
    };
    if (destination === "email") window.location.href = targets.email;
    else window.open(targets[destination], "_blank", "noopener,noreferrer");
  };

  return <>
    <nav className="sf-breadcrumbs sf-pdp-breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>›<Link href="/shop">Shop</Link></span><span>›<b>{product.name}</b></span></nav>
    <article className="sf-product-detail">
      <section className="sf-pdp-gallery" data-has-thumbnails={images.length > 1} aria-label={`${product.name} images`}>
        {images.length > 1 && <div className="sf-pdp-thumbnails">{images.map((image, index) => <button type="button" key={image.src} className={index === activeIndex ? "is-active" : ""} aria-label={`View image ${index + 1}`} aria-pressed={index === activeIndex} onClick={() => setActiveImage(image.src)}><img src={image.src} alt="" /></button>)}</div>}
        <div className="sf-product-detail-image" onPointerMove={(event) => { if (event.pointerType === "touch") return; const bounds = event.currentTarget.getBoundingClientRect(); const image = event.currentTarget.querySelector(":scope > img") as HTMLElement | null; image?.style.setProperty("--pdp-image-x", `${(((event.clientX - bounds.left) / bounds.width) - .5) * -12}px`); image?.style.setProperty("--pdp-image-y", `${(((event.clientY - bounds.top) / bounds.height) - .5) * -12}px`); }} onPointerLeave={(event) => { const image = event.currentTarget.querySelector(":scope > img") as HTMLElement | null; image?.style.setProperty("--pdp-image-x", "0px"); image?.style.setProperty("--pdp-image-y", "0px"); }}>{active ? <img src={active.src} alt={active.alt || product.name} /> : <div className="sf-catalogue-placeholder" aria-hidden="true" />}{product.isNew && <span className="sf-pdp-badge">NEW</span>}{images.length > 1 && <><button type="button" className="sf-pdp-image-arrow sf-pdp-image-previous" aria-label="Previous image" onClick={() => moveImage(-1)}>‹</button><button type="button" className="sf-pdp-image-arrow sf-pdp-image-next" aria-label="Next image" onClick={() => moveImage(1)}>›</button></>} {active && <button type="button" className="sf-pdp-expand" aria-label="View image full screen" onClick={() => setFullScreen(true)}>⛶</button>}</div>
      </section>
      <section className="sf-pdp-summary">
        {product.isNew && <span className="sf-pdp-label">New arrival</span>}
        <h1>{product.name}</h1>
        {product.shortDescription && <p className="sf-pdp-short-description">{product.shortDescription}</p>}
        <strong className="sf-pdp-price">{productPrice(product, selectedVariant)}</strong>
        {product.variants.length > 0 && <fieldset className={`sf-pdp-options ${notice.startsWith("Please") ? "has-missing" : ""}`}><legend>{product.variantOptionName || "Choose an option"}</legend><div>{product.variants.map((variant) => <button type="button" key={variant.id} disabled={!variant.purchasable} aria-pressed={selectedVariantId === variant.id} onClick={() => chooseVariant(variant)}><b>{variant.label || "Standard"}</b></button>)}</div>{product.variants.length > 1 && selectedVariant && <button className="sf-pdp-clear" type="button" onClick={() => setSelectedVariantId("")}>Clear selection</button>}</fieldset>}
        <div className="sf-pdp-quantity"><span>Quantity</span><div><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><output aria-label="Quantity">{quantity}</output><button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(99, value + 1))}>+</button></div></div>
        <p className="sf-pdp-stock" data-available={Boolean(selectedVariant?.purchasable)}>{selectedVariant ? (selectedVariant.purchasable ? "● In stock" : "Sold out") : `Select ${product.variantOptionName || "an option"} to see availability`}</p>
        <div className="sf-pdp-actions"><button type="button" onClick={add} disabled={Boolean(selectedVariant && !selectedVariant.purchasable)}>Add to Cart</button><button type="button" className="sf-pdp-wishlist" aria-pressed={wishlisted} onClick={() => setWishlisted(toggleWishlist(product.id))}>{wishlisted ? "♥ Saved to Wishlist" : "♡ Add to Wishlist"}</button></div>
        {notice && <p className="sf-pdp-notice" role="status">{notice}</p>}
        {(product.specifications?.length ?? 0) > 0 && <section className="sf-pdp-more"><h2><span>More information</span><svg aria-hidden="true" viewBox="0 0 190 14" preserveAspectRatio="none"><path d="M2 8 C28 3 48 12 75 7 S126 4 188 7" /><path d="M4 11 C47 9 91 12 154 9" /></svg></h2>{product.specifications?.map((specification) => <details key={specification.code}><summary>{specification.label}</summary><div className="sf-pdp-more-value">{specification.table ? <>{specification.table.caption && <p>{specification.table.caption}</p>}<table><tbody>{specification.table.rows.map((row) => <tr key={`${row.label}-${row.value}-${row.unit}`}><th scope="row">{row.label}</th><td>{row.value}{row.unit ? ` ${row.unit}` : ""}</td></tr>)}</tbody></table></> : specification.values.length ? <ul>{specification.values.map((value) => <li key={value}>{value}</li>)}</ul> : <p>{specification.displayValue}</p>}</div></details>)}</section>}
        <section className="sf-pdp-share" aria-label="Share this product"><b>Share this product</b><div><button type="button" onClick={() => void share("native")} aria-label="Share or copy product link"><ShareIcon name="share" /></button><button type="button" onClick={() => void share("whatsapp")} aria-label="Share on WhatsApp"><ShareIcon name="whatsapp" /></button><button type="button" onClick={() => void share("facebook")} aria-label="Share on Facebook"><ShareIcon name="facebook" /></button><button type="button" onClick={() => void share("email")} aria-label="Share by email"><ShareIcon name="email" /></button><button type="button" onClick={() => void share("pinterest")} aria-label="Share on Pinterest"><ShareIcon name="pinterest" /></button></div></section>
      </section>
    </article>
    {(product.longDescription || product.shortDescription) && <section className="sf-pdp-description"><h2>Description</h2><p>{product.longDescription || product.shortDescription}</p></section>}
    {frequentlyBoughtTogether.length > 0 && <section className="sf-pdp-bundle"><header><h2>Frequently Bought Together</h2><p>Complete your purchase with these popular pairings.</p></header><div className="sf-pdp-bundle-products">{frequentlyBoughtTogether.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    {recommendations.length > 0 && <section className="sf-pdp-related sf-plp-results"><header><div><h2>You May Also Like</h2><p>More products you might enjoy.</p></div><Link href="/shop">View All</Link></header><div className="sf-product-grid sf-pdp-related-products">{recommendations.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    {brandValues && brandValues.items.length > 0 && <section className="sf-pdp-brand-values" aria-label={brandValues.heading || "Our values"}>{brandValues.items.map((item) => <article key={item.id}><StorefrontIcon name={item.icon} /><span><strong>{item.title}</strong>{item.description && <small>{item.description}</small>}</span></article>)}</section>}
    {fullScreen && active && <div className="sf-pdp-lightbox" role="dialog" aria-modal="true" aria-label={`${product.name} full-screen image`} onMouseDown={(event) => event.target === event.currentTarget && setFullScreen(false)}><button type="button" aria-label="Close full-screen image" onClick={() => setFullScreen(false)}>×</button><img src={active.src} alt={active.alt || product.name} /></div>}
  </>;
}

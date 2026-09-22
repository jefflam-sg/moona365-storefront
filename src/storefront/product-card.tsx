"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PublicProduct } from "./contracts";
import { addCartLine, toggleWishlist, wishlistHas } from "./commerce-local";
import { safeImageSource } from "./safe-values";

/* Public image URLs are validated by the catalogue boundary. */
/* eslint-disable @next/next/no-img-element */

type Variant = PublicProduct["variants"][number];
const formatMoney = (amount: string, currency: string) => {
  try { return new Intl.NumberFormat("en-SG", { style: "currency", currency }).format(Number(amount)); }
  catch { return `${currency} ${amount}`; }
};

function priceDisplay(product: PublicProduct, selected?: Variant) {
  if (selected) return { current: formatMoney(selected.price.amount, selected.price.currency), original: selected.compareAtPrice ? formatMoney(selected.compareAtPrice.amount, selected.compareAtPrice.currency) : null };
  const variants = product.variants.filter((variant) => variant.purchasable);
  const source = variants.length ? variants : product.variants;
  if (!source.length) return { current: "", original: null };
  const sorted = [...source].sort((a, b) => Number(a.price.amount) - Number(b.price.amount));
  const first = sorted[0]; const last = sorted[sorted.length - 1];
  return { current: Number(first.price.amount) === Number(last.price.amount) ? formatMoney(first.price.amount, first.price.currency) : `${formatMoney(first.price.amount, first.price.currency)} – ${formatMoney(last.price.amount, last.price.currency)}`, original: null };
}

function discountBadge(variant?: Variant) {
  if (!variant?.compareAtPrice) return null;
  const before = Number(variant.compareAtPrice.amount); const now = Number(variant.price.amount);
  if (!(before > now && before > 0)) return "SALE";
  return `-${Math.round((1 - now / before) * 100)}%`;
}

function ActionIcon({ name }: { name: "cart" | "eye" | "heart" }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{name === "cart" && <><path d="M3 4h2l2 12h10l3-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></>}{name === "eye" && <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}{name === "heart" && <path d="M20 5c-3-3-6-1-8 2-2-3-5-5-8-2-4 4 1 10 8 15 7-5 12-11 8-15Z"/>}</svg>;
}

export function ProductCard({ product }: { product: PublicProduct }) {
  const direct = product.variants.length === 1 ? product.variants[0] : undefined;
  const [selectedId, setSelectedId] = useState(direct?.id ?? "");
  const [quickView, setQuickView] = useState(false);
  const [missing, setMissing] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const selected = product.variants.find((variant) => variant.id === selectedId);
  const inlineOptions = Boolean(product.variantOptionName && product.variants.length > 1 && product.variants.length <= 8);
  const resolved = selected ?? direct;
  const image = resolved?.primaryImage ?? product.primaryImage;
  const src = image ? safeImageSource(image.src) : null;
  const price = priceDisplay(product, resolved);
  const purchasableVariants = product.variants.filter((variant) => variant.purchasable);
  const badgeVariant = resolved ?? (purchasableVariants.length > 0 && purchasableVariants.every((variant) => variant.compareAtPrice) ? purchasableVariants[0] : undefined);
  const saleBadge = discountBadge(badgeVariant);
  const href = `/products/${product.id}`;
  useEffect(() => {
    const frame = requestAnimationFrame(() => setWishlisted(wishlistHas(product.id)));
    return () => cancelAnimationFrame(frame);
  }, [product.id]);
  useEffect(() => { if (!quickView) return; const close = (event: KeyboardEvent) => event.key === "Escape" && setQuickView(false); document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [quickView]);
  const optionLabel = product.variantOptionName || "Option";
  const cartLabel = resolved?.purchasable ? "Add to Cart" : product.variants.some((variant) => variant.purchasable) ? "Select Options" : "Sold Out";
  const selectVariant = (variant: Variant) => { setSelectedId(variant.id); setMissing(false); };
  const add = (quantity = 1) => {
    if (!resolved || !resolved.purchasable) {
      if (inlineOptions) { setMissing(true); setPulse(true); window.setTimeout(() => setPulse(false), 750); }
      else setQuickView(true);
      return;
    }
    addCartLine(product.id, resolved.id, quantity); setAdded(true); window.setTimeout(() => setAdded(false), 1400);
  };
  const variants = useMemo(() => product.variants, [product.variants]);
  return <article className="sf-product-card" data-sold-out={!product.variants.some((variant) => variant.purchasable)}>
    <div className="sf-product-visual">
      <Link href={href} aria-label={`View ${product.name}`}>{image && src ? <img src={src} alt={image.alt || product.name} /> : <div className="sf-catalogue-placeholder" aria-hidden="true" />}</Link>
      <div className="sf-product-badges">{product.isNew && <span>NEW</span>}{saleBadge && <span>{saleBadge}</span>}</div>
      <div className="sf-card-actions">
        <button type="button" aria-label={cartLabel} data-tooltip={cartLabel} onClick={() => add()}><ActionIcon name="cart" /></button>
        <button type="button" aria-label="Quick View" data-tooltip="Quick View" onClick={() => setQuickView(true)}><ActionIcon name="eye" /></button>
        <button type="button" aria-label={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"} data-tooltip={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"} aria-pressed={wishlisted} onClick={() => setWishlisted(toggleWishlist(product.id))}><ActionIcon name="heart" /></button>
      </div>
    </div>
    <div className="sf-product-copy">
      <Link href={href}><h3>{product.name}</h3></Link>
      <div className={`sf-card-options ${pulse ? "is-pulsing" : ""}`} aria-live="polite">
        {inlineOptions ? <><span className="sf-option-label">{missing && !resolved ? `Please select ${optionLabel}` : optionLabel}</span><div>{variants.map((variant) => <button type="button" key={variant.id} disabled={!variant.purchasable} aria-pressed={selectedId === variant.id} title={variant.label || "Standard"} onClick={() => selectVariant(variant)}>{variant.label || "Standard"}</button>)}</div></> : <span className="sf-option-placeholder">{product.variants.length > 1 ? "Options available" : ""}</span>}
      </div>
      <div className="sf-card-price">{price.original && <del>{price.original}</del>}<strong>{price.current}</strong></div>
      {added && <div className="sf-card-notice" role="status">Added to cart</div>}
    </div>
    {quickView && <QuickView product={product} selectedId={selectedId} onSelect={selectVariant} onClose={() => setQuickView(false)} onAdd={add} />}
  </article>;
}

function QuickView({ product, selectedId, onSelect, onClose, onAdd }: { product: PublicProduct; selectedId: string; onSelect: (variant: Variant) => void; onClose: () => void; onAdd: (quantity?: number) => void }) {
  const [quantity, setQuantity] = useState(1); const selected = product.variants.find((variant) => variant.id === selectedId);
  const image = selected?.primaryImage ?? product.primaryImage; const src = image ? safeImageSource(image.src) : null; const price = priceDisplay(product, selected);
  return <div className="sf-quick-view-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="sf-quick-view" role="dialog" aria-modal="true" aria-label={`Quick view: ${product.name}`}>
    <button className="sf-quick-close" type="button" aria-label="Close Quick View" onClick={onClose}>×</button>
    <div className="sf-quick-image">{image && src ? <img src={src} alt={image.alt || product.name} /> : <div className="sf-catalogue-placeholder" />}</div>
    <div><h2>{product.name}</h2><div className="sf-card-price">{price.original && <del>{price.original}</del>}<strong>{price.current}</strong></div>{product.shortDescription && <p>{product.shortDescription}</p>}
      {product.variants.length > 1 && <fieldset><legend>{product.variantOptionName || "Choose an option"}</legend><div className="sf-quick-options">{product.variants.map((variant) => <button type="button" key={variant.id} disabled={!variant.purchasable} aria-pressed={selectedId === variant.id} onClick={() => onSelect(variant)}>{variant.label || "Standard"}</button>)}</div></fieldset>}
      <p className="sf-availability">{selected ? (selected.purchasable ? "In stock" : "Sold out") : "Select an option to continue"}</p>
      <div className="sf-quick-buy"><label>Quantity<input type="number" min="1" max="99" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(99, Number(event.target.value) || 1)))} /></label><button type="button" disabled={!selected?.purchasable} onClick={() => onAdd(quantity)}>{selected ? (selected.purchasable ? "Add to Cart" : "Sold Out") : "Select Options"}</button></div>
      <Link href={`/products/${product.id}`}>View Full Details →</Link>
    </div>
  </section></div>;
}

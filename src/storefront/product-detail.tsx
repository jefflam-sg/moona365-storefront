"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HomepageCatalogue, HomepageSection, PublicProduct } from "./contracts";
import { addCartLine, toggleWishlist, wishlistHas } from "./commerce-local";
import { StorefrontIcon } from "./icons";
import { ProductCard } from "./product-card";
import { safeImageSource } from "./safe-values";
import { renderHomepageSection } from "./sections/registry";

/* Tenant media sources are validated by the public catalogue boundary. */
/* eslint-disable @next/next/no-img-element */

type Variant = PublicProduct["variants"][number];
type ProductImage = { src: string; alt: string };

function ShareIcon({ name }: { name: "share" | "whatsapp" | "facebook" | "email" | "pinterest" }) {
  return <svg className={`sf-share-icon sf-share-icon-${name}`} aria-hidden="true" viewBox="0 0 24 24">
    {name === "share" && <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" /></>}
    {name === "whatsapp" && <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />}
    {name === "facebook" && <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />}
    {name === "email" && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>}
    {name === "pinterest" && <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026l.032-.026Z" />}
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

function RichDescription({ product }: { product: PublicProduct }) {
  const content = product.descriptionContent;
  const [videoPlayer, setVideoPlayer] = useState<{ videoId: string; title: string } | null>(null);
  useEffect(() => {
    if (!videoPlayer) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setVideoPlayer(null);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [videoPlayer]);
  if (!content?.blocks.length)
    return product.longDescription || product.shortDescription ? <p>{product.longDescription || product.shortDescription}</p> : null;
  return <><div className="sf-rich-description">{content.blocks.map((block, index) => {
    if (block.type === "paragraph") return <p key={`paragraph-${index}`}>{block.text}</p>;
    if (block.type === "video") {
      const title = block.title || "Product video";
      return <button type="button" className="sf-rich-description-video" key={`video-${index}`} aria-label={`Play ${title}`} onClick={() => setVideoPlayer({ videoId: block.videoId, title })}><img src={`https://i.ytimg.com/vi/${block.videoId}/hqdefault.jpg`} alt="" /><span aria-hidden="true">▶</span><strong>{title}</strong></button>;
    }
    const src = safeImageSource(block.src); if (!src) return null;
    return <div className={`sf-rich-description-image sf-rich-description-${block.placement} sf-rich-description-size-${block.size}`} key={`image-${index}`}><figure><img src={src} alt={block.alt} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>{block.placement !== "full" && block.text && <p>{block.text}</p>}</div>;
  })}</div>{videoPlayer && <div className="sf-rich-video-modal" role="dialog" aria-modal="true" aria-label={videoPlayer.title} onClick={() => setVideoPlayer(null)}><div onClick={(event) => event.stopPropagation()}><button type="button" aria-label="Close video" onClick={() => setVideoPlayer(null)}>×</button><iframe src={`https://www.youtube-nocookie.com/embed/${videoPlayer.videoId}?autoplay=1&rel=0`} title={videoPlayer.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div></div>}</>;
}

export function ProductDetail({ product, initialVariantId, recommendations = [], frequentlyBoughtTogether = [], bottomSections = [], catalogue = { categories: [], collections: [], productsBySectionId: {} } }: { product: PublicProduct; initialVariantId?: string; recommendations?: PublicProduct[]; frequentlyBoughtTogether?: PublicProduct[]; bottomSections?: HomepageSection[]; catalogue?: HomepageCatalogue }) {
  const initialVariant = product.variants.find((variant) => variant.id === initialVariantId) ?? (product.variants.length === 1 ? product.variants[0] : undefined);
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
        <div className="sf-pdp-quantity"><span>Quantity</span><div><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><input aria-label="Quantity" type="number" inputMode="numeric" min="1" max="99" value={quantity} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setQuantity(Math.min(99, Math.max(1, Number(event.target.value) || 1)))} /><button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(99, value + 1))}>+</button></div></div>
        <p className="sf-pdp-stock" data-available={Boolean(selectedVariant?.purchasable)}>{selectedVariant ? (selectedVariant.purchasable ? "● In stock" : "Sold out") : `Select ${product.variantOptionName || "an option"} to see availability`}</p>
        <div className="sf-pdp-actions"><button type="button" onClick={add} disabled={Boolean(selectedVariant && !selectedVariant.purchasable)}>Add to Cart</button><button type="button" className="sf-pdp-wishlist" aria-pressed={wishlisted} onClick={() => setWishlisted(toggleWishlist(product.id))}>{wishlisted ? "♥ Saved to Wishlist" : "♡ Add to Wishlist"}</button></div>
        {notice && <p className="sf-pdp-notice" role="status">{notice}</p>}
        {(product.specifications?.length ?? 0) > 0 && <section className="sf-pdp-more"><h2><span>More information</span><svg aria-hidden="true" viewBox="0 0 210 14" preserveAspectRatio="none"><path pathLength="1" d="M4 3.4 C53 2.8 154 3.2 206 4.1 L27 7.1 C72 6.5 139 7.2 184 8.3 L57 11.2" /></svg></h2>{product.specifications?.map((specification) => <details key={specification.code}><summary>{specification.icon && <span className="sf-pdp-spec-icon"><StorefrontIcon name={specification.icon} /></span>}{specification.label}</summary><div className="sf-pdp-more-value">{specification.table ? <>{specification.table.caption && <p>{specification.table.caption}</p>}<table><tbody>{specification.table.rows.map((row) => <tr key={`${row.label}-${row.value}-${row.unit}`}><th scope="row">{row.label}</th><td>{row.value}{row.unit ? ` ${row.unit}` : ""}</td></tr>)}</tbody></table></> : specification.values.length ? <ul>{specification.values.map((value) => <li key={value}>{value}</li>)}</ul> : <p>{specification.displayValue}</p>}</div></details>)}</section>}
        <section className="sf-pdp-share" aria-label="Share this product"><b>Share this product</b><div><button type="button" onClick={() => void share("native")} aria-label="Share or copy product link"><ShareIcon name="share" /></button><button type="button" onClick={() => void share("whatsapp")} aria-label="Share on WhatsApp"><ShareIcon name="whatsapp" /></button><button type="button" onClick={() => void share("facebook")} aria-label="Share on Facebook"><ShareIcon name="facebook" /></button><button type="button" onClick={() => void share("email")} aria-label="Share by email"><ShareIcon name="email" /></button><button type="button" onClick={() => void share("pinterest")} aria-label="Share on Pinterest"><ShareIcon name="pinterest" /></button></div></section>
      </section>
    </article>
    {(product.descriptionContent?.blocks.length || product.longDescription || product.shortDescription) && <section className="sf-pdp-description"><h2>Description</h2><RichDescription product={product} /></section>}
    {frequentlyBoughtTogether.length > 0 && <section className="sf-pdp-bundle"><header><h2>Frequently Bought Together</h2><p>Complete your purchase with these popular pairings.</p></header><div className="sf-pdp-bundle-products">{frequentlyBoughtTogether.map((item) => <ProductCard key={`${item.id}:${item.selectedVariantId ?? "all"}`} product={item} />)}</div></section>}
    {recommendations.length > 0 && <section className="sf-pdp-related sf-plp-results"><header><div><h2>You May Also Like</h2><p>More products you might enjoy.</p></div><Link href="/shop">View All</Link></header><div className="sf-product-grid sf-pdp-related-products">{recommendations.map((item) => <ProductCard key={`${item.id}:${item.selectedVariantId ?? "all"}`} product={item} />)}</div></section>}
    {bottomSections.map((section) => renderHomepageSection(section, false, catalogue))}
    {fullScreen && active && <div className="sf-pdp-lightbox" role="dialog" aria-modal="true" aria-label={`${product.name} full-screen image`} onMouseDown={(event) => event.target === event.currentTarget && setFullScreen(false)}><button type="button" aria-label="Close full-screen image" onClick={() => setFullScreen(false)}>×</button><img src={active.src} alt={active.alt || product.name} /></div>}
  </>;
}

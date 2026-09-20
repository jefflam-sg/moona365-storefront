"use client";
/* eslint-disable @next/next/no-img-element -- URLs are tenant content validated by the backend contract. */
import type { HomepageCatalogue, WebsiteDesign, WebsiteNavigation } from "./contracts";
import Link from "next/link";
import { StorefrontIcon } from "./icons";
import { safeImageSource } from "./safe-values";
import { useEffect, useRef, useState } from "react";
import { resolveNavigation, type ResolvedNavigationNode } from "./navigation";

export function StorefrontBrand({ design, preview = false }: { design: WebsiteDesign; preview?: boolean }) {
  const { brand } = design;
  const logo =
    brand.logoSource === "text"
      ? null
      : brand.logoSource === "organization"
        ? brand.organization.logo
        : brand.logo;
  const logoSource = logo ? safeImageSource(logo.src) : null;
  const content = logoSource ? (
    <img className="sf-logo" src={logoSource} alt={logo?.alt || brand.name} />
  ) : (
    <strong className="sf-wordmark">{brand.name}<span>•</span></strong>
  );
  return <Link className="sf-brand-home" href="/" aria-label={`${brand.name} homepage`} onClick={preview ? (event) => event.preventDefault() : undefined}>{content}</Link>;
}

function NavLink({ item, preview }: { item: ResolvedNavigationNode; preview: boolean }) {
  return item.href ? <Link href={item.href} onClick={preview ? (event) => event.preventDefault() : undefined}>{item.label}</Link> : <span>{item.label}</span>;
}

export function StorefrontHeader({ design, preview, navigation, catalogue = { categories: [], collections: [], productsBySectionId: {} } }: { design: WebsiteDesign; preview: boolean; navigation?: WebsiteNavigation; catalogue?: HomepageCatalogue }) {
  const { header } = design;
  const items = resolveNavigation("main", navigation, catalogue);
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const root = useRef<HTMLElement>(null);
  useEffect(() => { const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(null); }; const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(null); setMobile(false); } }; document.addEventListener("pointerdown", close); document.addEventListener("keydown", escape); return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); }; }, []);
  const nested = (children: ResolvedNavigationNode[]) => <ul>{children.map((child) => <li key={child.id}><NavLink item={child} preview={preview} />{child.children.length > 0 && nested(child.children)}</li>)}</ul>;
  return (
    <header ref={root} className="sf-header" data-sticky={header.sticky} data-position={header.logoPosition} data-style={header.style}>
      {header.showAnnouncement && <div className="sf-announcement">{header.announcement}</div>}
      <div className="sf-header-main sf-width">
        <div className="sf-brand"><StorefrontBrand design={design} preview={preview} /></div>
        <button type="button" className="sf-mobile-menu-button" aria-expanded={mobile} aria-label="Open navigation" onClick={() => setMobile((value) => !value)}>☰</button>
        <nav className="sf-navigation" data-mobile-open={mobile} aria-label="Main navigation"><ul>{items.map((item) => <li key={item.id} onMouseEnter={() => (item.children.length > 0 || item.promo) && setOpen(item.id)} onMouseLeave={() => setOpen(null)}><div className="sf-navigation-trigger"><NavLink item={item} preview={preview} />{(item.children.length > 0 || item.promo) && <button type="button" aria-expanded={open === item.id} aria-label={`Show ${item.label} menu`} onClick={() => setOpen(open === item.id ? null : item.id)}>⌄</button>}</div>{(item.children.length > 0 || item.promo) && <div className={`sf-navigation-panel ${item.presentation === "MEGA_MENU" ? "sf-mega-menu" : "sf-dropdown"}`} data-open={open === item.id} style={item.presentation === "MEGA_MENU" ? { "--sf-mega-columns": item.columns } as React.CSSProperties : undefined}>{nested(item.children)}{item.promo && <a className="sf-mega-promo" href={item.promo.href ?? undefined} onClick={preview ? (event) => event.preventDefault() : undefined}>{item.promo.image && safeImageSource(item.promo.image.src) && <img src={safeImageSource(item.promo.image.src)!} alt={item.promo.image.alt} />}<strong>{item.promo.heading}</strong>{item.promo.text && <span>{item.promo.text}</span>}</a>}</div>}</li>)}</ul></nav>
        <div className="sf-tools" aria-label="Store tools">
          {header.showSearch && <button type="button" disabled={preview} aria-label="Search"><StorefrontIcon name="search" /></button>}
          <button type="button" disabled={preview} aria-label="Account"><StorefrontIcon name="account" /></button>
          <button type="button" disabled={preview} aria-label="Cart"><StorefrontIcon name="cart" /><sup>0</sup></button>
        </div>
      </div>
    </header>
  );
}
